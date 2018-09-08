import React from 'react';
import { Input } from 'semantic-ui-react'

export class NumericInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: null };
    }

    onChange = (data) => {
        if(this.valueChangedTimer) {
            clearTimeout(this.valueChangedTimer);
        }
        this.setState({...this.state, value: data.value});
        this.valueChangedTimer = setTimeout( this.mergeState, 900);
        
    }

    mergeState = () => {
        if(! this.props.onChange || this.props.readOnly || this.state.value === null ) {
            return;
        }
        if(this.valueChangedTimer) {
            clearTimeout(this.valueChangedTimer);
            this.valueChangedTimer = null;
        }
        this.setValue(this.state.value);
    }

    setValue = (newValue) => {
        let value = this.props.parse(newValue);
        if(this.props.min !== undefined) {
            value = Math.max(value, this.props.min);
        }
        if(this.props.max !== undefined) {
            value = Math.min(value, this.props.max);
        }
        this.props.onChange(value);
        this.setState({...this.state, value: null });
    }

    value = () => this.state.value === null ? this.props.format(this.props.value) : this.state.value;

    step = (direction) => {
        if(! this.props.step) {
            return;
        }
        const newValue = this.props.value + (direction * this.props.step)
        this.setValue(`${newValue}`);
    }

    onKeyUp = (keyEvent) => {
        if(keyEvent.key === 'ArrowUp') {
            this.step(+1);
        }
        if(keyEvent.key === 'ArrowDown') {
            this.step(-1);
        }
    }

    render = () => {
        const  { value, format, parse, min, max, step, onChange, ...args } = this.props;
        return (
            <Input
                onKeyUp={e => this.onKeyUp(e)}
                onBlur={() => this.mergeState()}
                className='indi-number'
                value={this.value()}
                onChange={(e, data) => this.onChange(data)}
                type='text' {...args}
                
            />
        )
    }
}


