import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
    getHelpPage() {
        return /* html */ `
        <html lang="en">
            <head>
            <meta charset="utf-8" />
            <title>Nomic API - Help</title> 
            <style>
                body {
                    font-family: sans-serif;
                    padding: 1rem 2rem;
                }
                a:link, a:visited {
                    color: #0000EE;
                    text-decoration: none;
                }
            </style>
            </head>
            <body>
                <section id="introduction">
                <h1>Nomic API - Help</h1>
                    <p>
                        The Nomic API provides a GraphQL interface for running inference with GPT4All.
                        You can experiment with the API using the <a href="/graphql" target="_blank">GraphQL Playground</a>.
                    </p>
                </section>
                <section id="quick-links">
                    <h2>Quick Links</h2>
                    <ol>
                        <li><a href="/graphql" target="_blank">GraphQL Playground</a></li>
                        <li><a href="https://home.nomic.ai" target="_blank" rel="noreferrer">Nomic.ai</a></li>
                        <li><a href="https://github.com/nomic-ai/gpt4all" target="_blank" rel="noreferrer">Github - GPT4All Repo</a></li>
                    </ol>
                </section
            </body>
        </html>`.trim()
    }
}
