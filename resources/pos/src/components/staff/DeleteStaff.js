import React from "react";
import { connect } from "react-redux";
import { deleteStaff } from "../../store/action/staffAction";
import DeleteModel from "../../shared/action-buttons/DeleteModel";
import { getFormattedMessage } from "../../shared/sharedMethod";

const DeleteStaff = (props) => {
    const { deleteStaff, onDelete, deleteModel, onClickDeleteModel } = props;

    const deleteStaffClick = () => {
        deleteStaff(onDelete.id);
        onClickDeleteModel(false);
    };

    return (
        <div>
            {deleteModel && (
                <DeleteModel
                    onClickDeleteModel={onClickDeleteModel}
                    deleteModel={deleteModel}
                    deleteUserClick={deleteStaffClick}
                    name={getFormattedMessage("staff.table.staff.column.title")}
                />
            )}
        </div>
    );
};

export default connect(null, { deleteStaff })(DeleteStaff);
