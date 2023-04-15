import { Controller, Get, Header, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AppService } from './app.service'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getIndex(@Req() req: Request, @Res() res: Response): string | undefined {
        const accept = req.header('accept')
        const wantsHtml =
            (typeof accept === 'string' && accept.includes('text/html')) ||
            (Array.isArray(accept) && accept.some(a => a.includes('text/html')))
        if (wantsHtml) {
            // Redirect to /help
            res.redirect('/help')
            return
        } else {
            throw new Error('Not Found')
        }
    }

    @Get('/help')
    @Header('Content-Type', 'text/html')
    getHelp(): string {
        return this.appService.getHelpPage()
    }
}
