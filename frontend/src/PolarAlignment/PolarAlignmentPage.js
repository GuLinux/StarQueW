import React from 'react';
import { DARV } from './DARV';
import { Routes } from '../routes';
import { Container, Menu} from 'semantic-ui-react';
import { Route } from 'react-router';
import { NavLink } from 'react-router-dom';
import { HistoryLandingContainer } from '../Navigation/HistoryLandingContainer';

export const PolarAlignmentPage = () => (
    <Container fluid>
        <Container>
            <Menu stackable>
                    <Menu.Item as={NavLink} exact={true} to={Routes.POLAR_ALIGNMENT_DARV} >DARV - Drift Alignment</Menu.Item>
            </Menu>
        </Container>
        <Container fluid>
            <HistoryLandingContainer route={Routes.POLAR_ALIGNMENT_PAGE} defaultLandingPath={Routes.POLAR_ALIGNMENT_DARV}>
                <Route path={Routes.POLAR_ALIGNMENT_DARV} exact={true} component={DARV} />
            </HistoryLandingContainer>
        </Container>
    </Container>
);


