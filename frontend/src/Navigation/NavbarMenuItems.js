import React from 'react';
import { Menu, Dropdown } from 'semantic-ui-react';

import { NavLink } from 'react-router-dom';
export const NavbarMenu = (props) => <Menu stackable inverted size='large' {...props} />
export const SiteMenuHeader = (props) => <Menu.Item header {...props}>StarQuew</Menu.Item>



export const NavItem = ({disabled, ...args}) => <Menu.Item disabled={disabled} as={disabled ? 'a' : NavLink} {...args} />

const pageNavItem = (item, index, Component) => {
    const overrideProps = { className: 'pageNavItem' };
    if(item.openModal) {
        const { openModal: ModalClass, modalProps = {}, ...props } = item;
        return <ModalClass trigger={<Component {...props} {...overrideProps} />} {...modalProps} key={index}/>
    }
    return <Component {...item} {...overrideProps} key={index} />
}

const pageMenuItems = (sectionMenu, itemComponent) => {
    let children = [];
    if(sectionMenu.navItems) {
        const menuItems = sectionMenu.navItems.map((item, index) => pageNavItem(item, index, itemComponent));
        children = children.concat(menuItems);
    }
    return children;
}

export const NavbarMenuItems = ({disabled, hasConnectedCameras, sectionMenu, isResponsive=false, onClick = () => true}) => (
    <React.Fragment>
        <NavItem icon='list' content='Sequences' to="/sequences" disabled={disabled} onClick={onClick} />
        <NavItem icon='computer' content='INDI Server' to="/indi" disabled={disabled} onClick={onClick} />
        <NavItem icon='camera' content='Camera' to="/camera" disabled={disabled || ! hasConnectedCameras} onClick={onClick}/>
        <NavItem icon='settings' content='System & Settings' to="/settings" disabled={disabled} onClick={onClick} />
        { !isResponsive && (
            <Menu.Menu position='right'>
                { sectionMenu && (

                        <Dropdown item text={sectionMenu.section}>
                            <Dropdown.Menu>
                                {pageMenuItems(sectionMenu, Dropdown.Item)}
                            </Dropdown.Menu>
                        </Dropdown>

                )}
            </Menu.Menu>
        )}
        { isResponsive && (
            <React.Fragment>
                { sectionMenu && (
                    <Menu.Item>
                        {sectionMenu.section}
                        <Menu.Menu>
                            {pageMenuItems(sectionMenu, Menu.Item)}
                        </Menu.Menu>
                    </Menu.Item>
                )}
            </React.Fragment>
        )}
    </React.Fragment>
)


