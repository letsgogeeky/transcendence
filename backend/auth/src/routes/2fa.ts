import { OtpMethod } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import axios from 'axios';
import { FastifyInstance } from 'fastify';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import credentialAuthCheck from '../plugins/credentialAuth.js';
import { successfulLogin } from './login.js';

export const OtpVerifyDto = Type.Object({
    token: Type.String(),
});

export const OtpSetup = Type.Object({
    method: Type.Enum(OtpMethod),
    phoneNumber: Type.Optional(Type.String()),
});

async function sendSms(
    phoneNumber: string,
    code: string,
    fastify: FastifyInstance,
) {
    const authorization = `App ${fastify.config.INFOBIP_TOKEN}`;
    const postData = {
        messages: [
            {
                channel: 'SMS',
                sender: fastify.config.INFOBIP_SENDER,
                destinations: [
                    {
                        to: phoneNumber,
                    },
                ],
                content: {
                    body: {
                        text: `Your Transcendence verification code is ${code}`,
                        type: 'TEXT',
                    },
                },
            },
        ],
    };

    const config = {
        method: 'post',
        url: `https://${fastify.config.INFOBIP_ID}.api.infobip.com/messages-api/1/messages`,
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        data: postData,
    };

    await axios(config);
}

function generateSecret(): {
    otpAuthUrl: string;
    code: string;
    secret: OTPAuth.Secret;
} {
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
        issuer: 'transcendence.com',
        label: 'Transcendence',
        algorithm: 'SHA1',
        digits: 6,
        secret: secret,
        period: 180,
    });
    const otpAuthUrl = totp.toString();
    const code = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
    });
    return { otpAuthUrl, code, secret };
}

export function otpRoutes(fastify: FastifyInstance) {
    fastify.register(credentialAuthCheck);

    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (!error.statusCode || error.statusCode == 500)
            reply.status(400).send({ error: 'Something went wrong.' });
        else reply.status(error.statusCode).send({ error: error.message });
    });

    fastify.post(
        '/otp/generate',

        async (req, res) => {
            const user = await fastify.prisma.user.findUnique({
                where: { id: req.user },
            });

            if (!user) {
                return res.status(404).send({
                    error: 'No user with that id exists',
                });
            }
            if (!user.otpMethod)
                return res.status(403).send({
                    error: 'OTP generation is not allowed for this user.',
                });
            const { otpAuthUrl, code, secret } = generateSecret();
            if (user.otpMethod == OtpMethod.AUTHENTICATOR && user.hasQrCode)
                return res
                    .status(200)
                    .send({ message: 'QR code already sent' });
            await fastify.prisma.user.update({
                where: { id: req.user },
                data: {
                    otpBase32: secret.base32,
                },
            });
            if (user.otpMethod == OtpMethod.SMS) {
                await sendSms(user.phoneNumber!, code, fastify);
                res.send({ message: 'SMS sent' });
            } else if (user.otpMethod == OtpMethod.AUTHENTICATOR) {
                await fastify.prisma.user.update({
                    where: { id: req.user },
                    data: { hasQrCode: 1 },
                });
                const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
                return res.send({ otpAuthUrl: qrCodeDataUrl });
            } else {
                await fastify.transporter.sendMail({
                    from: '"noreply transcendence" <noreply.transcendence2025@gmail.com>',
                    to: user.email,
                    subject: 'Your Transcendence verification code',
                    html: 'Your code is ' + code, // html body
                });
                res.status(200).send({ message: 'email sent' });
            }
        },
    );

    fastify.post<{ Body: Static<typeof OtpVerifyDto> }>(
        '/otp/verify',
        {
            schema: {
                body: OtpVerifyDto,
                response: {
                    200: { otpVerified: Boolean },
                },
            },
        },

        async (req, res) => {
            const { token } = req.body;
            const user = await fastify.prisma.user.findUnique({
                where: { id: req.user },
            });
            console.log(user);
            const message = "Token is invalid or user doesn't exist";
            if (!user) {
                return res.status(401).send({
                    error: message,
                });
            }
            const totp = new OTPAuth.TOTP({
                issuer: 'transcendence.com',
                label: 'Transcendence',
                algorithm: 'SHA1',
                digits: 6,
                secret: user.otpBase32!,
            });
            const delta = totp.validate({ token });
            console.log(`delta: ${delta}`);
            if (delta === null) {
                return res.status(401).send({ error: message });
            }
            return successfulLogin(fastify, res, user, true);
        },
    );
}
