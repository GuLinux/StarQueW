import { getINDIServerStatusAPI, setINDIServerConnectionAPI, getINDIDevicesAPI, getINDIDevicePropertiesAPI, setINDIValuesAPI, autoconnectDeviceAPI, autoloadConfigurationAPI } from '../middleware/api';
import Actions from '../actions';
import { getCurrentSettings } from '../Settings/selectors';
import { getServerState } from './selectors';

export const INDIServer = {
    serverConnectionNotify: (state, isError, notifyOnError) => dispatch => {
        dispatch(INDIServer.receivedServerState(state));
        if(isError) {
            notifyOnError && dispatch(Actions.Notifications.add('INDI Server connection', 'Error while connecting to INDI server', 'error'));
        } else {
            dispatch(Actions.Notifications.add('INDI Server connection', 'INDI server connected successfully', 'success', 10000));
        }
    },

    serverDisconnectNotify: (state, isError) => dispatch => {
        dispatch(INDIServer.receivedServerState(state));
        if(isError) {
            dispatch(Actions.Notifications.add('INDI Server connection', 'Error while disconnecting to INDI server.', 'error'));
        } else {
            dispatch(Actions.Notifications.add('INDI Server connection', 'INDI server disconnected successfully.', 'success', 10000));
        }
    },


    serverDisconnectErrorNotify: (state, dispatch) => {
        dispatch(INDIServer.receivedServerState(state.payload));
        return Actions.Notifications.add('Error', 'INDI server disconnected. Please check your server logs.', 'error');
    },


    receivedServerState: (state, fetchFullTree = false) => (dispatch, getState) => {
        if(fetchFullTree && state.connected) {
            dispatch(INDIServer.fetchDevices());
        }
        dispatch({
            type: 'RECEIVED_SERVER_STATE',
            state
        })
    },

    receivedDevices: (devices, dispatch) => {
        devices.forEach(device => dispatch(INDIServer.fetchDeviceProperties(device)));
        return {
            type: 'RECEIVED_INDI_DEVICES',
            devices
        }
    },

    receivedDeviceProperties: (device, data) => dispatch => {
        dispatch({
            type: 'RECEIVED_DEVICE_PROPERTIES',
            device,
            properties: data
        });
        dispatch(Actions.INDIServer.autoconnectDevice(device.name));
    },

    fetchDeviceProperties: device => {
        return dispatch => {
            dispatch({type: 'FETCH_INDI_DEVICE_PROPERTIES'});
            return getINDIDevicePropertiesAPI(dispatch, device, data => {
                dispatch(INDIServer.receivedDeviceProperties(device, data));
            });
        }
    },

    fetchDevices: () => {
        return dispatch => {
            dispatch({type: 'FETCH_INDI_DEVICES'});
            return getINDIDevicesAPI(dispatch, data => dispatch(INDIServer.receivedDevices(data, dispatch)));
        }
    },

    fetchServerState: (fetchFullTree = false) => {
        return dispatch => {
            dispatch({type: 'FETCH_INDI_SERVER_STATE'});
            return getINDIServerStatusAPI(dispatch, data => dispatch(INDIServer.receivedServerState(data, fetchFullTree)));
        }
    },

    setServerConnection: (connect, notifyOnError = true) => {
        return dispatch => {
            dispatch({type: connect ? 'CONNECT_INDI_SERVER' : 'DISCONNECT_INDI_SERVER'});
            return setINDIServerConnectionAPI(dispatch, connect, data => {
                dispatch(INDIServer.receivedServerState(data, true));
                const action = connect ? INDIServer.serverConnectionNotify : INDIServer.serverDisconnectNotify;
                const isError = data.connected !== connect;
                dispatch(action(data, isError, notifyOnError));
            });
        }
    },

    autoconnectServer: () => (dispatch, getState) => {
        const state = getState();
        const indiServerConnected = getServerState(state).connected;
        if(!indiServerConnected) {
            const settings = getCurrentSettings(getState());
            if(settings.indi_server_autoconnect) {
                dispatch(Actions.INDIServer.setServerConnection(true, false));
            }
        }
    },


    autoloadConfig: (device, retry = 0) => dispatch => {
        return autoloadConfigurationAPI(
            dispatch,
            device.name,
            json => {
                if(json.result)
                dispatch({type: 'INDI_CONFIG_AUTOLOADED', device});
            },
            err => {
                if((err.status === 404 || err.status === 400) && retry < 3) {
                    setTimeout(() => dispatch(Actions.INDIServer.autoloadConfig(device, retry+1)), 1000);
                    return true;
                }
                return false;
            }
        );
    },

    autoconnectDevice: (device, retry=0) => async (dispatch, getState) => {
        if(getCurrentSettings(getState()).indi_drivers_autostart) {
            await dispatch(Actions.INDIServer.autoloadConfig({name: device}));
            autoconnectDeviceAPI(
                dispatch,
                device,
                json => {
                    dispatch(Actions.INDIServer.autoloadConfig({name: device}));
                },
                err => {
                    if(err.status === 404) {
                        setTimeout(() => dispatch(Actions.INDIServer.autoconnectDevice(device, retry+1)), 1000);
                        return true;
                    }
                    console.log(err)
                    return false;
                }
            );
        }
    },

    setPropertyValues: (device, property, values) => {
        return dispatch => {
            setINDIValuesAPI(dispatch, device, property, values, json => {});
            dispatch({ type: 'INDI_REQUEST_SET_PROPERTY_VALUES', property, values})
        }
    },

    deviceMessage: (device, message) => ({ type: 'INDI_DEVICE_MESSAGE', device, message }),

    propertyUpdated: property => (dispatch, getState) => {
        if(property.name === 'CONNECTION') {
            if(property.values.find(v => v.name === 'CONNECT' && v.value)) {
                dispatch({type: 'INDI_DEVICE_CONNECTED', device: property.device})
            }
            else {
                dispatch({type: 'INDI_DEVICE_DISCONNECTED', device: property.device})
            }
        }
        dispatch({ type: 'INDI_PROPERTY_UPDATED', property })
    },

    propertyAdded: property => (dispatch, getState) => {
        dispatch({ type: 'INDI_PROPERTY_ADDED', property });
    },

    propertyRemoved: property => ({ type: 'INDI_PROPERTY_REMOVED', property }),

    deviceAdded: device => dispatch => {
        dispatch({ type: 'INDI_DEVICE_ADDED', device });
        dispatch(Actions.INDIServer.fetchDeviceProperties(device));
        dispatch(Actions.INDIServer.autoconnectDevice(device.name));
    },
    
    deviceRemoved: device => ({ type: 'INDI_DEVICE_REMOVED', device }),
}

export default INDIServer

