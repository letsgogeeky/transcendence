const schema = {
    type: 'object',
    required: [
        'MATCH_DB_PATH',
        'MATCH_PORT',
        'UPLOAD_DIR',
        'SSL_KEY_PATH',
        'SSL_CERT_PATH',
        'FRONTEND',
        'SECRET',
    ],
    properties: {
        MATCH_DB_PATH: { type: 'string' },
        MATCH_PORT: { type: 'number' },
        UPLOAD_DIR: { type: 'string' },
        SSL_KEY_PATH: { type: 'string' },
        SSL_CERT_PATH: { type: 'string' },
        FRONTEND: { type: 'string' },
        SECRET: { type: 'string' },
    },
};

export const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env,
};
