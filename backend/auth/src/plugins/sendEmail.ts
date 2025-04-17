import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';

const emailPlugin: FastifyPluginCallback = fp((server, _options, done) => {
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreply.transcendence2025@gmail.com',
            pass: server.config.GOOGLE_PASS,
        },
		tls: {
			rejectUnauthorized: false,
		},
    });
    server.decorate('transporter', transporter);
    done();
});

export default emailPlugin;
