const schema = {
    type: 'object',
    required: ['DB_PATH', 'SECRET', 'PORT'],
    properties: {
        DB_PATH: { type: 'string' },
        SECRET: { type: 'string' },
        PORT: { type: 'number' },
    },
};

export const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env,
};
