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
   Login with username+password.

    GET /login/google
    Will redirect to google login. If google login is valid but user email is not registered, error is thrown ("No account found with this Google email. Please sign up first.")
    If email is already registered, but this is the first time they try logging in with google, they will get the gooleToken in the response, that they need to send to /login/link-google together with their password
    to confirm linking Google login. Only after that will they be able to use remote login seamlessly.

    Both will return UserId and authToken. If 2FA is disabled (default) this token is sufficient. It should be sent in all future request headers, as Authorization: Bearer {{authToken}}
    sets refreshToken cookie. Whenever the request has an expired access token, 401 { error: 'Token expired' } will be sent. Then the frontend needs to initiate refresh, by POST to /refresh

    POST /login/link-google
    Send gooleToken and password to link Google account

    POST /refresh
    Verifies the refresh token sent as cookie. If valid, sends new authToken.

3. POST /otp/setup Setup 2FA method
   Sets up the 2FA method. Users can choose from 3 options: SMS, EMAIL, or AUTHENTICATOR.
   For SMS, they need to send phoneNumber in request body.
   After setup, user is logged out and should be prompted to log in with 2FA

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

8. Authentication will maintain a socket connection with the client to send real-time updates about other users' status changes, ensuring the frontend stays up-to-date. A user's online status is updated when their socket is disconnected.
   {"type":"STATUS_CHANGE",
   "data":{"message":"User logged out", "id":"3ed54bb6-d940-4edf-8b2c-cefaf62557b5"}
   }

GET /users?status=online
returns online users (all who have socket connection open)

after login the user must initiate socket connection to endpoint
wss://<HOST>/socket/
to be visible to other users and to receive updates about their online status changes
