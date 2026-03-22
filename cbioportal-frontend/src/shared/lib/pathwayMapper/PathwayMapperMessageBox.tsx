import * as React from 'react';
import FontAwesome from 'react-fontawesome';

interface PathwayMapperMessageBoxProps {
    message: string;
    loadingMessage: string;
    onClearMessage: () => void;
}

const PathwayMapperMessageBox: React.FunctionComponent<PathwayMapperMessageBoxProps> = props => {
    const message = props.message;
    const isWarningMessage = message !== props.loadingMessage;
    return (
        <div
            data-test="pathwayMapperMessageBox"
            className={
                'alert ' +
                (isWarningMessage ? 'alert-warning' : 'alert-success')
            }
            style={{
                marginLeft: '1%',
                marginBottom: '0px',
                marginTop: '5px',
                color: 'black',
                maxHeight: '32px',
                overflowY: 'auto',
                display: message.length == 0 ? 'none' : 'block',
            }}
        >
            <button
                type="button"
                className="close"
                onClick={props.onClearMessage}
            >
                <FontAwesome name="times" />
            </button>
            {isWarningMessage && (
                <i
                    className="fa fa-md fa-exclamation-triangle"
                    style={{
                        marginRight: '6px',
                        marginBottom: '1px',
                    }}
                />
            )}
            {message}
        </div>
    );
};

export default PathwayMapperMessageBox;
