import React from 'react';
import { Label } from 'react-bootstrap'
import INDILight from './INDILight'

const bsStyles = {
    IDLE: 'default',
    OK: 'success',
    BUSY: 'warning',
    ALERT: 'danger'
}

const INDILightProperty = ({property}) => (
    <div className="row">
        <div className="col-xs-1"><INDILight state={property.state} /></div> 
        <div className="col-xs-2">{property.label}</div> 
        <div className="col-xs-9">
            {property.values.map(value => ( <INDILight key={value.name} state={value.value} text={value.label} /> ) )}
        </div>
    </div>
)
 
export default INDILightProperty
