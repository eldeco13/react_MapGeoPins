import React, {useState, useEffect, useContext} from "react";
import ReactMapGL, {NavigationControl, Marker, Popup} from 'react-map-gl'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { unstable_useMediaQuery as useMediaQuery } from '@material-ui/core/useMediaQuery'

import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";

import {Subscription} from 'react-apollo'
import { PIN_ADDED_SUBSCRIPTION, PIN_UPDATED_SUBSCRIPTION, PIN_DELETED_SUBSCRIPTION } from '../graphql/subscriptions'

import PinIcon from './PinIcon'
import Context from '../context'
import Blog from './Blog'
import {useClient} from '../client'
import {GET_PINS_QUERY} from '../graphql/queries'
import {DELETE_PIN_MUTATION} from '../graphql/mutations'

const INITIAL_VIEWPORT = {
  latitude: 41.32306,
  longitude: 19.44139,
  zoom: 13
}

const Map = ({ classes }) => {
  const client = useClient()
  const mobileSize = useMediaQuery('(max-width: 650px)')
  const [viewport, setViewPort] = useState(INITIAL_VIEWPORT)
  const [userPosition, setUserPosition] = useState(null)
  const {state, dispatch} = useContext(Context)
  useEffect(() => {
    getUserPosition()
  },[]);

  const [popup, setPopup] = useState(null)

  useEffect(() => {
    getPins();
  },[]);

  const getPins = async () => {
    const { getPins } = await client.request(GET_PINS_QUERY)
    console.log('getPins ' + getPins)
    dispatch({type: "GET_PINS", payload: getPins})
  }

  const getUserPosition = () => {
    if("geolocation" in navigator){
      navigator.geolocation.getCurrentPosition(position => {
        const {latitude, longitude} = position.coords
        setViewPort({...viewport, latitude, longitude})
        setUserPosition({latitude, longitude})
      })
    }
  }

  const handleMapClick = ({lngLat, leftButton}) => {
    if(!leftButton) {
      console.log('not left')
      return
    }

    if(!state.draft) {
      console.log('create_draft')
      dispatch({type: "CREATE_DRAFT"})
    }

    const [longitude, latitude] = lngLat
    dispatch({
      type: "UPDATE_DRAFT_LOCATION",
      payload: {longitude, latitude}
    })
  };

  const highlightNewPin = pin => {
    const isNewPin = differenceInMinutes(Date.now(), Number(pin.createdAt)) <= 30

    return isNewPin ? "limegreen" : "darkblue"
  }

  const handleSelectPin = pin => {
    setPopup(pin)
    dispatch({type: "SET_PIN", payload: pin})
  }

  const isAuthUser = () => state.currentUser._id === popup.author._id 

  const handleDeletePin = async pin => {
    const variables = {pinId: pin._id}
    await client.request(DELETE_PIN_MUTATION, variables)
    setPopup(null)
  }

  return (
  <div className={mobileSize ? classes.rootMobile : classes.root}>
    <ReactMapGL
      width="100vw"
      height="calc(100vh - 64px)"
      mapStyle="mapbox://styles/mapbox/streets-v9"
      mapboxApiAccessToken=
        "pk.eyJ1IjoiZWxkZWNvZGlnaXRhbCIsImEiOiJjazZtNXZ1bGcwYjl4M21vaGV2eXpqcWZyIn0.qOxuQFf_dxEgndZgKTvcqw"
      scrollZoom={!mobileSize}
      onViewportChange={newViewPort => setViewPort(newViewPort)}
      onClick={handleMapClick}
        {...viewport}
    >
      <div className={classes.navigationControl}> 
            <NavigationControl 
              onViewportChange={newViewPort => setViewPort(newViewPort)}
            />
      </div>
      {userPosition && (
        <Marker
          latitude={userPosition.latitude}
          longitude={userPosition.longitude}
          offsetLeft={-19}
          offsetTop={-37}
          >
            <PinIcon size={40} color="red" />
          </Marker>
      )}
      {state.draft && (
        
          <Marker
            latitude={state.draft.latitude}
            longitude={state.draft.longitude}
            offsetLeft={-19}
            offsetTop={-37}
            >
            <PinIcon size={40} color="hotpink" />
          </Marker>
      )}

        {/* display created pins */}
        {state.pins.map(pin => (
          <>
          <PinIcon size={40} color="red" />
            <Marker
              key={pin._id}
              latitude={pin.latitude}
              longitude={pin.longitude}
              offsetLeft={-19}
              offsetTop={-37}
              >
              <PinIcon 
              onClick={() => handleSelectPin(pin)} 
              size={40} 
              color={highlightNewPin(pin)} />
          </Marker>
          </>
        ))}

        {/* pop up dialogues for created pins */}
        {popup && (
          <Popup
            anchor="top"
            latitude={popup.latitude}
            longitude={popup.longitude}
            closeOnClick={false}
            onClose={() => setPopup(null)}
            >
              <img
                className = {classes.popupImage}
                src={popup.image}
                alt={popup.title} />
                <div className={classes.popupTab}>
                  <Typography>
                    {popup.latitude.toFixed(6)}, {popup.longitude.toFixed(6)}
                  </Typography>
                  {true && (
                    <Button onClick={() => handleDeletePin(popup)}>
                      <DeleteIcon className={classes.deleteIcon}/>
                    </Button>
                  )}
                </div>
            </Popup>
        )}

    </ReactMapGL>
        {/*  subscription  */}
         <Subscription
            subscription={PIN_ADDED_SUBSCRIPTION}
            onSubscriptionData={({ subscriptionData }) => {
              const {pinAdded} = subscriptionData.data
              console.log({ pinAdded })
              dispatch({type: "CREATE_PIN", payload: pinAdded})
            }}
         />

          <Subscription
            subscription={PIN_UPDATED_SUBSCRIPTION}
            onSubscriptionData={({ subscriptionData }) => {
              const {pinUpdated} = subscriptionData.data
              console.log({ pinUpdated })
              dispatch({type: "CREATE_COMMENT", payload: pinUpdated})
            }}
         />

          <Subscription
            subscription={PIN_DELETED_SUBSCRIPTION}
            onSubscriptionData={({ subscriptionData }) => {
              const {pinDeleted} = subscriptionData.data
              console.log({ pinDeleted })
              dispatch({type: "DELETE_PIN", payload: pinDeleted})
            }}
         />

{/*  blog area  */}
        <Blog />

    </div>
  );
};

const styles = {
  root: {
    display: "flex"
  },
  rootMobile: {
    display: "flex",
    flexDirection: "column-reverse"
  },
  navigationControl: {
    position: "absolute",
    top: 0,
    left: 0,
    margin: "1em"
  },
  deleteIcon: {
    color: "red"
  },
  popupImage: {
    padding: "0.4em",
    height: 200,
    width: 200,
    objectFit: "cover"
  },
  popupTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  }
};

export default withStyles(styles)(Map);
