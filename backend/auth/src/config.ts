const schema = {
    type: 'object',
    required: ['DB_PATH', 'SECRET', 'PORT', 'GOOGLE_PASS'],
    properties: {
        DB_PATH: { type: 'string' },
        SECRET: { type: 'string' },
        GOOGLE_PASS: { type: 'string' },
        PORT: { type: 'number' },
    },
};

export const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env,
};
