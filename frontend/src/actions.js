import Sequences from './Sequences/actions';
import SequenceJobs from './SequenceJobs/actions';
import INDIServer from './INDI-Server/actions';
import { Notifications } from './Notifications/actions';
import INDIService from './INDI-Service/actions';
import Camera from './Camera/actions';
import Settings from './Settings/actions';
import Image from './Image/actions';
import Navigation from './Navigation/actions';
import Commands from './Commands/actions';
import { PlateSolving } from './PlateSolving/actions';
import { fetchBackendVersion, API } from './middleware/api';
import listenToEvents from './middleware/events';
import { BackendSelection } from './BackendSelection/actions';
import { isError } from './Errors/selectors.js';

const Server = {

    retryTimer: null,

    error: (source, payloadType, payload, responseBody) => dispatch => {
        dispatch({ type: 'SERVER_ERROR', source, payloadType, payload, responseBody });
        Actions.Server.retryTimer = setTimeout(() => dispatch(Actions.init()), 1000);
    },
    fetchBackendVersion: () => dispatch => fetchBackendVersion(dispatch, version => dispatch({ type: 'BACKEND_VERSION_FETCHED', version })), 
};

const init = () => async (dispatch, getState) => {
    if(Server.retryTimer) {
        clearTimeout(Server.retryTimer);
    }
    const address = await Actions.BackendSelection.getAddress(dispatch);
    if(address === null) {
        console.log('No backend address found');
        return;
    }
    API.setBackendURL(address);
    await dispatch(Actions.Server.fetchBackendVersion());
    if(isError(getState())) {
        console.log('error getting state')
        return;
    }
    await dispatch(Actions.Settings.fetch());
    await dispatch(Actions.INDIServer.fetchServerState(true));
    await dispatch(Actions.INDIServer.autoconnectServer());
    dispatch(Actions.Sequences.fetch());
    dispatch(Actions.INDIService.fetchService());
    dispatch(Actions.INDIService.fetchProfiles());
    dispatch(Actions.Commands.get());
    listenToEvents(dispatch);
}

export const Actions = {
    Sequences,
    SequenceJobs,
    INDIServer,
    Notifications,
    INDIService,
    Camera,
    Settings,
    Image,
    Navigation,
    Commands,
    PlateSolving,
    BackendSelection,
    Server,
    init,
}

export default Actions
