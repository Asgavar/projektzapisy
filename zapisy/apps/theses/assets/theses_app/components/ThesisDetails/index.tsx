import * as React from "react";
import Button from "react-button-component";
import styled from "styled-components";
import update, { Query } from "immutability-helper";
import { Moment } from "moment";

import { Thesis, ThesisStatus, ThesisKind, Employee } from "../../types";
import { ThesisTopRow } from "./ThesisTopRow";
import { ThesisMiddleForm } from "./ThesisMiddleForm";
import { ThesisVotes } from "./ThesisVotes";

import { Spinner } from "../Spinner";
import { getDisabledStyle } from "../../utils";

const SaveButton = Button.extend`
	&:disabled:hover {
		background: white;
	}
	&:disabled {
		color: grey;
		cursor: default;
	}
	height: 25px;
	min-height: 25px;
	max-height: 25px;
`;

const DetailsSectionWrapper = styled.div`
display: flex;
justify-content: center;
align-items: center;
`;

const MainDetailsContainer = styled.div`
border: 1px solid black;
padding: 15px;
display: flex;
flex-direction: row;
width: 100%;
`;

const LeftDetailsContainer = styled.div`
width: 100%;
`;

const RightDetailsContainer = styled.div`
display: flex;
flex-direction: column;
justify-content: space-between;
margin-left: 20px;
`;

type Props = {
	thesis: Thesis;
	onThesisModified: (thesis: Thesis) => void;
	onSaveRequested: () => void;
	isSaving: boolean;
	shouldAllowSave: boolean;
};

export class ThesisDetails extends React.Component<Props> {
	public render() {
		const { shouldAllowSave } = this.props;

		return <DetailsSectionWrapper>
			{this.props.isSaving ? <Spinner style={{ position: "absolute" }}/> : null}
			<MainDetailsContainer
				style={this.props.isSaving ? getDisabledStyle() : {}}
			>
				<LeftDetailsContainer>
					<ThesisTopRow
						thesis={this.props.thesis}
						onReservationChanged={this.onReservationChanged}
						onDateChanged={this.onDateUpdatedChanged}
						onStatusChanged={this.onStatusChanged}
					/>
					<ThesisMiddleForm
						thesis={this.props.thesis}
						onTitleChanged={this.onTitleChanged}
						onKindChanged={this.onKindChanged}
						onAdvisorChanged={this.onAdvisorChanged}
						onAuxAdvisorChanged={this.onAuxAdvisorChanged}
						onStudentChanged={this.onStudentChanged}
						onSecondStudentChanged={this.onSecondStudentChanged}
						onDescriptionChanged={this.onDescriptionChanged}
					/>
				</LeftDetailsContainer>
				<RightDetailsContainer>
					<ThesisVotes />
					<SaveButton
						onClick={this.handleSave}
						disabled={!shouldAllowSave}
						title={shouldAllowSave ? "Zapisz zmiany" : "Nie dokonano zmian"}
					>Zapisz</SaveButton>
				</RightDetailsContainer>
			</MainDetailsContainer>
		</DetailsSectionWrapper>;
	}

	private updateThesisState(updateObject: Query<Thesis>) {
		this.props.onThesisModified(
			update(this.props.thesis, updateObject)
		);
	}

	private onReservationChanged = (newValue: boolean): void => {
		this.updateThesisState({ reserved: { $set: newValue } });
	}

	private onDateUpdatedChanged = (newDate: Moment): void => {
		this.updateThesisState({ modifiedDate: { $set: newDate } });
	}

	private onStatusChanged = (newStatus: ThesisStatus): void => {
		this.updateThesisState({ status: { $set: newStatus } });
	}

	private onTitleChanged = (newTitle: string): void => {
		this.updateThesisState({ title: { $set: newTitle } });
	}

	private onKindChanged = (newKind: ThesisKind): void => {
		this.updateThesisState({ kind: { $set: newKind } });
	}

	private onAdvisorChanged = (newAdvisor: Employee | null): void => {
		this.updateThesisState({ advisor: { $set: newAdvisor } });
	}

	private onAuxAdvisorChanged = (newAuxAdvisor: Employee | null): void => {
		this.updateThesisState({ auxiliaryAdvisor: { $set: newAuxAdvisor } });
	}

	private onStudentChanged = (newStudent: Employee | null): void => {
		this.updateThesisState({ student: { $set: newStudent } });
	}

	private onSecondStudentChanged = (newSecondStudent: Employee | null): void => {
		this.updateThesisState({ secondStudent: { $set: newSecondStudent } });
	}

	private onDescriptionChanged = (newDesc: string): void => {
		this.updateThesisState({ description: { $set: newDesc } });
	}

	private handleSave = () => {
		this.props.onSaveRequested();
	}
}