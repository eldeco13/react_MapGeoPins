const User = require('../models/User')
const {OAuth2Client} = require ('google-auth-library')

const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID)

exports.findOrCreateUser = async token => {
    //verify teh auth token
    const googleUser = await verifyAuthToken(token)
    //check if teh user exists
    const user = await checkIfUserExists(googleUser.email)
    console.log('user : ' + {user})
    //if user exists return it, otherwise create new user in db
    return user ? user : createNewUser(googleUser)

} 

const createNewUser = googleUser => {
    console.log('googleUser - : ' + googleUser)
    const {name, email, picture} = googleUser
    const user = {name, email, picture}

    return new User(user).save()
}

const verifyAuthToken = async token => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.OAUTH_CLIENT_ID
        })

        return ticket.getPayload()
    } catch (error) {
        console.error('error verifying the auth token', error)
    }
}

const checkIfUserExists = async email => {
    await User.findOne({email}).exec()
}