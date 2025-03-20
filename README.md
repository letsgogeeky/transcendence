# Transcendence on steroids

### User Journey
![User Journey](docs/user-journey.png)


### Decision records
- **Use the new subject** Fastify is a good lightweight and flexible framework.
- **Backend as Microservices** We have a good opportunity to build each backend component independently since we're using SQLite. (User Management, Match Making System, Real-time server for gaming, live chat, etc..) each one of these components can be built independently.


### Pong Platform user journeys and description

#### User / Player and Friend Management
- User can sign up with email and password
- User can sign in with email and password
- User can sign out
- User can reset password
- User can update password
- User can sign in with Google
- User can Update their profile information including profile picture (Avatar)
- User can view other users' profile information
- User can search for other users
- User can send friend requests to other users
- User can accept or reject friend requests
- User can unfriend other users


#### Match Making System
- User can create a match
- User can join a match
- User can leave a match
- User can view other users' match history
- User can view other users' match stats
- User can view other users' match achievements

#### Game
- User can see in real-time the game and the other players
- User can chat with other players
- User can see the game stats (score, etc..)
- User can leave the game at any time
- User can play in different modes (1v1, 2v2, 3v3, etc..)
- Opponents can be:
    - Other player on the same device using different keyboard keys
    - AI (pre-defined level of difficulty)
    - Other players on different devices (using the same keyboard keys)

#### In-Game socket communication
- User can send paddle move to the server
- User can receive paddle move from the server
- User can send ball move to the server
- User can receive ball move from the server
- User can see the game stats (score, etc..)
- User can see when the game starts and when it ends

#### In-Game socket objects
- Paddle
    ```json
    {
        "type": "paddle",
        "data": {
            "user_id": "123",
            "x": 100,
            "y": 200
        }
    }
    ```
- Ball (A vector2D object)
    ```json
    {
        "type": "ball",
        "data": {
            "user_id": "123",
            "x": 100,
            "y": 200,
            "direction": "up"
        }
    }
    ```
- Score
    ```json
    {
        "type": "score",
        "data": {
            "scoring_user_id": "123",
            "scored_user_id": "456",
            "score": 100
        }
    }
    ```
- Leave/Join Match
    ```json
    {
        "type": "leave_match",
        "data": {
            "user_id": "123"
        }
    }
    ```
    ```json
    {
        "type": "join_match",
        "data": {
            "user_id": "123"
        }
    }
    ```
