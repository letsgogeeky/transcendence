GET /verify-email Verify email address ?? is this necessary?

https://codevoweb.com/two-factor-authentication-2fa-in-nodejs/

after changes in database schema/ to create the database again with tables:
npm run db:migrate
npm run db:push

tool to see database content:
npx prisma studio

1. POST /register Register New User
   Register

2. POST /login Login User
   Login with username+password. It will return UserId and authToken. If 2FA is disabled (default) this token is sufficient. It should be sent in all future request headers, as Authorization: Bearer {{authToken}}

3. POST /otp/setup Setup 2FA method
   Sets up the 2FA method. Users can choose from 3 options: SMS, EMAIL, or AUTHENTICATOR.
   For SMS, they need to send phoneNumber in request body.

4. POST /otp/generate Generate the OTP
   OTP will be sent to chosen method. If no method set yet, they get 403 Error.
   AUTHENTICATOR method will send an otpAuthUrl. Frondend has to generate a QR code to be scanned with the Google Authenticator app.

5. POST /otp/verify Verify the OTP Secret
   Verifies the OTP. A new auth token is generated and returned. The new token should be used for future requests. The old token (obtained after the username + password login) will be blacklisted.

6. POST /otp/disable Disable the OTP Feature
   Fully authorized users can disable the OTP feature (2FA).

7. POST /logout Logout User
   Logs the user out. The previous token is blacklisted.

    PUT /user/avatar
    file: picture

    GET /images/{{filename}}
    serve all files located in UPLOAD_DIR
    public, can be accessed without login
