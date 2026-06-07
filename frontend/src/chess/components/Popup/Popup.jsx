import React from 'react';
import { createPortal } from 'react-dom';
import { Status } from '../../constants';
import { useAppContext }from '../../contexts/Context'
import { closePopup } from '../../reducer/actions/popup';
import PromotionBox from './PromotionBox/PromotionBox'
import './Popup.css'

const Popup = ({children}) => {

    const { appState : {status}, dispatch } = useAppContext();

    const onClosePopup = () => {
        dispatch(closePopup())
    }

    if (status === Status.ongoing)
        return null

    const isPromoting = status === Status.promoting;

    const popupContent = (
        <div className={`popup ${isPromoting ? 'popup--promoting' : 'popup--game-ends'}`}>
            {React.Children
                .toArray(children)
                .map (child => React.cloneElement(child, { onClosePopup }))}
        </div>
    );

    if (isPromoting) {
        return popupContent;
    }

    return createPortal(popupContent, document.body);
}

export default Popup