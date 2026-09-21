import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Card, Table } from "react-bootstrap";
import moment from "moment";
import { Image } from "react-bootstrap-v5";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import HeaderTitle from "../header/HeaderTitle";
import {
    getAvatarName,
    placeholderText,
    getFormattedMessage,
} from "../../shared/sharedMethod";
import { useParams } from "react-router-dom";
import { fetchStaffMember } from "../../store/action/staffAction";
import Spinner from "../../shared/components/loaders/Spinner";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const StaffDetail = (props) => {
    const { staff, isLoading, fetchStaffMember } = props;
    const { id } = useParams();
    const result = staff.reduce(
        (obj, cur) => ({ ...obj, [cur.type]: cur }),
        {}
    );
    const member = result.staff_profiles;

    useEffect(() => {
        fetchStaffMember(id);
    }, []);

    return (
        <MasterLayout>
            <TopProgressBar />
            <HeaderTitle
                title={getFormattedMessage("staff-details.title")}
                to="/app/staff"
                editLink={`/app/staff/edit/${id}`}
            />
            <TabTitle title={placeholderText("staff-details.title")} />
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <div>
                        <Card>
                            <Card.Body>
                                <div className="row">
                                    <div className="col-xxl-5 col-12">
                                        <div className="d-sm-flex align-items-center mb-5 mb-xxl-0 flex-row text-sm-start">
                                            <div className="image image-circle image-lg-small w-100px">
                                                {member &&
                                                member.attributes.image ? (
                                                    <Image
                                                        src={
                                                            member.attributes
                                                                .image
                                                        }
                                                        alt="Staff Profile"
                                                        className="object-fit-cover"
                                                    />
                                                ) : (
                                                    <span className="user_avatar">
                                                        {getAvatarName(
                                                            member &&
                                                                member
                                                                    .attributes
                                                                    .first_name +
                                                                    " " +
                                                                    member
                                                                        .attributes
                                                                        .last_name
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ms-0 ms-md-10 mt-5 mt-sm-0">
                                                <h2>
                                                    {member &&
                                                        member.attributes
                                                            .first_name +
                                                            " " +
                                                            member.attributes
                                                                .last_name}
                                                </h2>
                                                <span className="text-gray-600 fs-4">
                                                    {member &&
                                                        member.attributes.email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className="pt-5">
                        <Card>
                            <Card.Header as="h5">
                                {getFormattedMessage(
                                    "staff-details.table.title"
                                )}
                            </Card.Header>
                            <Card.Body className="pt-0">
                                <Table responsive>
                                    <tbody>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "staff.input.employee-code.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {member &&
                                                    member.attributes
                                                        .employee_code}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "staff.input.job-title.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {member &&
                                                    member.attributes.job_title}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "staff.input.department.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {member &&
                                                    member.attributes
                                                        .department}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "staff.input.commission-rate.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {member &&
                                                member.attributes
                                                    .commission_rate !== null
                                                    ? `${member.attributes.commission_rate}%`
                                                    : getFormattedMessage(
                                                          "staff.commission.default.label"
                                                      )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "user.input.phone-number.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {member &&
                                                    member.attributes.phone}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4">
                                                {getFormattedMessage(
                                                    "user-details.table.created-on.row.label"
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {moment(
                                                    member &&
                                                        member.attributes
                                                            .created_at
                                                ).fromNow()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </>
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { staff, isLoading } = state;
    return { staff, isLoading };
};

export default connect(mapStateToProps, { fetchStaffMember })(StaffDetail);
