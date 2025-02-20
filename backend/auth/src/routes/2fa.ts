import { LoginLevel, OtpMethod } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import axios from 'axios';
import { FastifyInstance } from 'fastify';
import * as OTPAuth from 'otpauth';
import speakeasy from 'speakeasy';
import credentialAuthCheck from '../plugins/credentialAuth.js';

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
            const { otpAuthUrl, code, secret } = generateSecret();
            await fastify.prisma.user.update({
                where: { id: req.user },
                data: {
                    otpBase32: secret.base32,
                },
            });
            if (!user.otpMethod)
                return res.status(403).send({
                    error: 'OTP generation is not allowed for this user.',
                });
            if (user.otpMethod == OtpMethod.SMS) {
                await sendSms(user.phoneNumber!, code, fastify);
                res.send({ message: 'SMS sent' });
            } else if (user.otpMethod == OtpMethod.AUTHENTICATOR)
                return res.send({ otpAuthUrl });
            else {
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
            if (delta === null) {
                return res.status(401).send({
                    message,
                });
            }
            await fastify.prisma.blacklistToken.create({
                data: {
                    token: req.headers['authorization']!.replace('Bearer ', ''),
                },
            });
            const authToken = fastify.jwt.sign(
                {
                    id: user.id,
                    loginLevel: LoginLevel.FULL,
                },
                { expiresIn: '1h', key: fastify.config.SECRET },
            );
            res.status(200).send({
                authToken,
            });
        },
    );
}
