const {ApolloServer} = require('apollo-server')
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')
const mongoose = require('mongoose');
require('dotenv').config();
const {findOrCreateUser} = require('./controllers/userController')

mongoose
    .connect(process.env.MONGO_URI, {useNewUrlParser: true})
    .then(() => console.log('DB connected!! : '))
    .catch(err => console.error(err));

    const myPlugin = {

        // Fires whenever a GraphQL request is received from a client.
        requestDidStart(requestContext) {
          console.log('Request started! Query:\n' +
            requestContext.request.query);
      
          return {
      
            // Fires whenever Apollo Server will parse a GraphQL
            // request to create its associated document AST.
            // parsingDidStart(requestContext) {
            //   console.log('Parsing started!');
            // }
      
            // Fires whenever Apollo Server will validate a
            // request's document AST against your GraphQL schema.
            // validationDidStart(requestContext) {
            //   console.log('Validation started!');
            // }
      
          }
        },
      };

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // plugins: [
    //     myPlugin
    //   ],
    context: async ({req}) => {
        let authToken = null
        let currentUser = null
        try {
            authToken = req.headers.authorization;
            //console.log('authtoken : ' + authtoken)
            if(authToken) {
                //find or create new user
                currentUser = await findOrCreateUser(authToken)
                console.log({currentUser})
            }
        } catch (error) {
            console.error(`something went wrong with the authtoken ${error}`)
        }
        //console.log('currentUser : ' + currentUser)
        return {currentUser}
    }
})

server.listen({port: process.env.PORT || 4000}).then( ({ url  }) => {
    console.log(`my server visi listening on ${url}`);
});
