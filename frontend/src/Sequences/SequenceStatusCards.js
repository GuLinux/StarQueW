import React from 'react';
import { Table, Label, Icon, Card } from 'semantic-ui-react';
import { INDISwitchPropertyContainer } from '../INDI-Server/INDIPropertyContainer';
import { INDILight } from '../INDI-Server/INDILight';
import { formatDecimalNumber } from '../utils';
import { secs2time } from '../utils';


const DeviceCardHeader = ({connected, name}) => {
    let labelStyle = connected ? 'green' : 'orange'
    let icon = connected ? 'check' : 'close';
    let connection = connected ? 'connected' : 'not connected';
    return (
        <React.Fragment>
            <Icon name={icon} color={labelStyle} circular style={{float: 'right'}} />
            <Card.Header size="medium">{name}</Card.Header>
            <Card.Meta color={labelStyle}>{connection}</Card.Meta>
        </React.Fragment>
    )

}


export const ExposuresCard = ({exposureJobsCount, totalShots, totalTime, completedShots, completedTime, remainingShots, remainingTime}) => (
    <Card>
        <Card.Content>
                <Icon name='camera' style={{float: 'right'}} />
                <Card.Header size='medium'>Exposures</Card.Header>
                <Card.Meta>{exposureJobsCount} sequences</Card.Meta>
                <Card.Description>
                    <Table definition basic compact='very' size='small'>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell content='Total' />
                                <Table.Cell content={totalShots} />
                                <Table.Cell content={<Label content={totalTime} />} />
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell content='Completed' />
                                <Table.Cell content={completedShots} />
                                <Table.Cell content={<Label content={completedTime} />} />
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell content='Remaining' />
                                <Table.Cell content={remainingShots} />
                                <Table.Cell content={<Label content={remainingTime}/> } />
                            </Table.Row>
                        </Table.Body>
                    </Table>
                </Card.Description>
        </Card.Content>
    </Card>
)

export const CameraDetailsCard = ({state, value, cameraConnected, cameraName}) => value ? (
    <Card>
        <Card.Content>
            <DeviceCardHeader name={cameraName} connected={cameraConnected} />
                <Card.Description>
                    <Label.Group>
                        <Label content='Current exposure: ' basic/>
                        <Label content={value} />
                        <INDILight state={state} />
                    </Label.Group>
                </Card.Description>
        </Card.Content>
    </Card>
) : null;

const FilterWheelDetailsPage = ({filterWheel, filterNumber, filterName}) => {
    if(!filterWheel)
        return null;
    return (
        <Card>
            <Card.Content>
                   <DeviceCardHeader device={filterWheel} />
                    <Card.Description>
                        {filterWheel.connected && (
                            <Label.Group>
                                <Label basic content='Current filter: '/>
                                <Label content={`${filterWheel.currentFilter.name} (${filterWheel.currentFilter.number})`}/>
                            </Label.Group>
                        )}
                    </Card.Description>
            </Card.Content>
        </Card>
    )
}


