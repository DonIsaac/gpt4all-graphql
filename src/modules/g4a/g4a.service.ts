import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common'
import { ChildProcess, spawn } from 'child_process'

type BinType = 'macos-intel' | 'macos-m1' | 'linux-x86' | 'windows-64'

@Injectable()
export class G4AService implements OnModuleInit, OnModuleDestroy {
    private logger: Logger
    private binPath: string
    private static readonly PROMPT_CHARACTER = '>'
    private static readonly binmap: Record<BinType, string> = {
        'macos-m1': 'gpt4all-lora-quantized-OSX-m1',
        'macos-intel': 'gpt4all-lora-quantized-OSX-intel',
        'linux-x86': 'gpt4all-lora-quantized-linux-x86',
        'windows-64': 'gpt4all-lora-quantized-win64.exe',
    }

    private modelProcess: ChildProcess | null = null

    // todo: consume config
    constructor() {
        this.logger = new Logger(G4AService.name)
        const binName = G4AService.binmap[this._getBinaryForPlatform()]
        this.binPath = path.join(process.cwd(), 'bin', binName)
    }

    onModuleInit() {
        this.start()
    }
    onModuleDestroy() {
        this.stop()
    }

    /**
     * Send a message to the model process
     *
     * @param message The message to send
     *
     * @returns A {@link Promise} that resolves once `message` has been fully
     * written to the model process' stdin, or rejects if an error occurs.
     */
    public async sendMessage(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.modelProcess) {
                throw new Error(
                    `Model process not running. Call start() first.`
                )
            }
            if (!this.modelProcess.stdin) {
                throw new TypeError(
                    `Model process has no stdin. This should not happen.`
                )
            }
            this.logger.debug(`Sending message to model process: ${message}`)

            // add Return to the end of the message
            message += os.EOL
            this.modelProcess.stdin.write(message, err => {
                if (err) return reject(err)
                else return resolve()
            })
        })
    }

    /**
     * Reads a response from the model process. Stdout is read until the model
     * stops emitting data.
     *
     * @param timeout How long to wait before assuming the model is done
     * @returns A {@link Promise} that resolves with the response from the model
     */
    public readResponse(timeout = 1_000): Promise<string> {
        return this._readResponse(timeout, 0, 2)
    }
    private _readResponse(
        timeout: number,
        nIter: number,
        maxIter: number
    ): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!this.modelProcess) {
                return reject(
                    new Error(`Model process not running. Call start() first.`)
                )
            }
            if (!this.modelProcess.stdout) {
                return reject(
                    new TypeError(
                        `Model process has no stdout. This should not happen.`
                    )
                )
            }
            this.logger.debug(`Reading response from model process...`)

            let response = ''
            // read from stdout until there is no more data. If nothing is
            // written to stdout after `timeout` ms, we assume the model is done
            // and resolve with the response.
            let timeoutHandle: NodeJS.Timeout | null = null
            const createTimeout = () =>
                setTimeout(() => {
                    this.logger.debug(
                        `Model process timed out after ${timeout} ms.`
                    )
                    this.modelProcess?.stdout?.removeListener('data', onData)
                    const cleanResponse = this._cleanModelResponse(response)
                    if (
                        (!cleanResponse ||
                            cleanResponse === G4AService.PROMPT_CHARACTER) &&
                        nIter < maxIter
                    ) {
                        this.logger.debug(
                            `Performing another read iteration (${
                                nIter + 1
                            }/${maxIter}))`
                        )
                        return resolve(
                            this._readResponse(timeout, nIter + 1, maxIter)
                        )
                    } else {
                        resolve(cleanResponse)
                    }
                }, timeout)

            const onData = (data: Buffer) => {
                response += data.toString()
                this.logger.debug(`Received data from model process: ${data}`)
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle)
                    timeoutHandle = null
                }
                timeoutHandle = createTimeout()
            }

            this.modelProcess.stdout.on('data', onData)
        })
    }
    private _cleanModelResponse(response: string): string {
        return (
            response
                // get rid of terminal color codes
                .replace(/\x1b\[[0-9;]*m/g, '')
                // remove trailing prompt
                // .replace(new RegExp(`\\s*${G4AService.PROMPT_CHARACTER}$`),
                // '')
                .replace(/\s*>\s*$/, '')
                .trim()
        )
    }

    /**
     * Start the GPT4all model process
     */
    public async start(): Promise<void> {
        if (this.modelProcess) return
        this.logger.debug(`Starting model process with binary ${this.binPath}`)

        // make sure the binary exists and is executable
        try {
            await fs.access(this.binPath, fs.constants.X_OK)
            this.logger.debug(`Binary exec check succeeded`)
        } catch (err) {
            // unpacking to omit values
            const { name, message, stack, ...rest } = err as Error
            const error = new Error(
                `Binary ${this.binPath} is not executable. Make sure the file exists and the permissions are set correctly.`
            )
            Object.assign(error, rest)
            throw error
        }

        // TODO: support cli args from config
        this.modelProcess = spawn(this.binPath, ['--interactive'], {
            cwd: process.cwd(),
            env: process.env,
        })
        this.modelProcess.on('spawn', () => {
            this.logger.debug(
                `Model process spawned (pid: ${this.modelProcess?.pid})`
            )
        })
        // GPT4all writes debug logs to stderr
        this.modelProcess.stderr?.on('data', data => {
            data = data.toString().trim()
            // ignore empty lines or the annoying "." loading indicator
            if (data && !/^\s*\.?\s*$/.test(data)) {
                this.logger.debug(`Model process stderr: ${data}`)
            }
        })
        this.modelProcess.on('error', err => {
            const error = new Error(
                `Error while starting model process: ${err.message}`
            )
            // this.logger.error(err)
            throw error
        })
        // do not attach listeners to keep stdout in paused mode
        // this.modelProcess.
    }

    /**
     * Stop the GPT4all model process
     */
    public stop(forceKillAfter = 5_000): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            if (!this.modelProcess) return resolve()
            this.logger.debug(`Stopping model process`)

            let killTimeout: NodeJS.Timeout | null = null

            this.modelProcess.on('close', (code, signal) => {
                this.logger.debug(
                    `Model process closed with code ${code} and signal ${signal}`
                )
                if (killTimeout) {
                    clearTimeout(killTimeout)
                    killTimeout = null
                }
                resolve()
            })

            this.modelProcess.kill('SIGINT')
            killTimeout = setTimeout(() => {
                this.logger.warn('Force killing model process')
                this.modelProcess?.kill('SIGKILL')
            }, forceKillAfter)
        })
    }

    private _getBinaryForPlatform(): BinType {
        const platform = os.platform()
        const arch = os.arch()
        switch (platform) {
            case 'darwin': {
                if (os.arch() === 'arm64') {
                    return 'macos-m1'
                } else {
                    return 'macos-intel'
                }
            }

            case 'win32': {
                if (arch === 'x64') {
                    return 'windows-64'
                } else {
                    throw new Error(`Unsupported architecture ${arch}`)
                }
            }
            case 'linux': {
                if (os.arch() === 'x64') {
                    return 'linux-x86'
                } else {
                    throw new Error(`Unsupported architecture ${arch}`)
                }
            }
            default: {
                throw new Error(
                    `Unsupported platform ${os.platform()} on ${os.arch()}`
                )
            }
        }
    }
}
