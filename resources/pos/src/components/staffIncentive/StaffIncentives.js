import React, { useState } from "react";
import { connect } from "react-redux";
import { Nav, Tab } from "react-bootstrap";
import MasterLayout from "../MasterLayout";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import StaffIncentiveEarnings from "./StaffIncentiveEarnings";
import StaffIncentivePayouts from "./StaffIncentivePayouts";

const StaffIncentives = () => {
    const [key, setKey] = useState("earnings");

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("staff-incentives.title")} />
            <div className="card">
                <div className="card-body">
                    <Tab.Container
                        activeKey={key}
                        onSelect={(k) => setKey(k || "earnings")}
                    >
                        <Nav variant="tabs" className="mb-4">
                            <Nav.Item>
                                <Nav.Link eventKey="earnings">
                                    {getFormattedMessage(
                                        "staff-incentive.earnings.title"
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="payouts">
                                    {getFormattedMessage(
                                        "staff-incentive.payouts.title"
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Tab.Content>
                            <Tab.Pane eventKey="earnings">
                                {key === "earnings" && (
                                    <StaffIncentiveEarnings />
                                )}
                            </Tab.Pane>
                            <Tab.Pane eventKey="payouts">
                                {key === "payouts" && (
                                    <StaffIncentivePayouts />
                                )}
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </div>
        </MasterLayout>
    );
};

export default connect(null, null)(StaffIncentives);
