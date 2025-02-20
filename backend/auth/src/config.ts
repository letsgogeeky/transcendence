const schema = {
    type: 'object',
    required: [
        'DB_PATH',
        'SECRET',
        'REFRESH_SECRET',
        'PORT',
        'GOOGLE_PASS',
        'INFOBIP_ID',
        'INFOBIP_TOKEN',
        'INFOBIP_SENDER',
    ],
    properties: {
        DB_PATH: { type: 'string' },
        SECRET: { type: 'string' },
        REFRESH_SECRET: { type: 'string' },
        GOOGLE_PASS: { type: 'string' },
        PORT: { type: 'number' },
        INFOBIP_ID: { type: 'string' },
        INFOBIP_TOKEN: { type: 'string' },
        INFOBIP_SENDER: { type: 'string' },
    },
};

export const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env,
};
