import React, { createElement } from 'react';
import { Text } from 'react-native';

export const renderFontAwesomeIcon = (iconName: string) =>
    createElement('i', {
        className: `fa fa-${iconName}`,
        style: { marginRight: '6px', fontSize: '11px' }
    });