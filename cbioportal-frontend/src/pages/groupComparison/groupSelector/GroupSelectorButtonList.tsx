import * as React from 'react';
import { observer } from 'mobx-react';
import styles from '../styles.module.scss';
import { SortableContainer } from 'react-sortable-hoc';

export interface IGroupSelectorButtonListProps {
    buttons: any[];
}

@observer
class GroupSelectorButtonList extends React.Component<
    IGroupSelectorButtonListProps,
    {}
> {
    render() {
        return (
            <div className={styles.groupButtons}>
                <div>{this.props.buttons}</div>
            </div>
        );
    }
}

export default SortableContainer(GroupSelectorButtonList);
