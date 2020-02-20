import React, {useContext} from "react";
import {GoogleLogin} from 'react-google-login'
import {GraphQLClient} from 'graphql-request'
import { withStyles } from "@material-ui/core/styles";
import Context from '../../context'
import Typography from "@material-ui/core/Typography";
import {ME_QUERY} from '../../graphql/queries'
import { BASE_URL } from "../../client";




const Login = ({ classes }) => {
  const {dispatch} = useContext(Context)

  const onSuccess = async googleUser => {
    try {
      const idToken = googleUser.getAuthResponse().id_token;
      console.log('id_token : ' + idToken)
      const client = new GraphQLClient(BASE_URL,
        {headers: {authorization: idToken}
      })
      const {me} = await client.request(ME_QUERY);
      console.log({me})
      dispatch({type: "LOGIN_USER", payload: me})
      dispatch({type: "IS_LOGGED_IN", payload: googleUser.isSignedIn()})
    } catch (error) {
      onFailure(error)
    }

  };  

  const onFailure = err => {
    console.log('Error occured!', err)
    dispatch({type: "IS_LOGGED_IN", payload: false})
  }

  return <div className={classes.root}>
    <Typography
      component="h1"
      variant="h3" 
      gutterBottom
      noWrap
      style={{color: "rgb(66,133,244)"}}>
      Welcome
    </Typography>
    <GoogleLogin 
    clientId="607304384118-eue4voovma861vcsea74pde2vucukle2.apps.googleusercontent.com"
    onSuccess={onSuccess}
    onFailure={onFailure}
    isSignedIn={true}
    buttonText="Login with google"
    theme="dark"/></div>
  };

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center"
  }
};

export default withStyles(styles)(Login);
