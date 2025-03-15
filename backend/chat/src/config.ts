const schema = {
    type: 'object',
    required: [
        'DB_PATH',
        'PORT',
        'UPLOAD_DIR',
        'SSL_KEY_PATH',
        'SSL_CERT_PATH',
        'SSL_PASSPHRASE',
        'FRONTEND',
    ],
    properties: {
        DB_PATH: { type: 'string' },
        PORT: { type: 'number' },
        UPLOAD_DIR: { type: 'string' },
        SSL_KEY_PATH: { type: 'string' },
        SSL_CERT_PATH: { type: 'string' },
        SSL_PASSPHRASE: { type: 'string' },
        FRONTEND: { type: 'string' },
    },
};

export const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env,
};
