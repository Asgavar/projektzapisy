import * as React from "react";
import { ThesisVote } from "../../../../protocol_types";
import styled from "styled-components";
import { canCastVoteAsUser, canChangeThesisVote } from "../../../../permissions";
import { VoteIndicator } from "../VoteIndicator";
import { Employee, AppUser } from "../../../../users";
import { Thesis } from "../../../../thesis";

type Props = {
	user: AppUser;
	value: ThesisVote;
	voter: Employee;
	thesis: Thesis;
	onChange: (voter: Employee, v: ThesisVote) => void;
};

const voteCycle = [ThesisVote.None, ThesisVote.Accepted, ThesisVote.Rejected];

export class SingleVote extends React.PureComponent<Props> {
	public render() {
		const { user, voter, thesis } = this.props;
		const allowAction = canCastVoteAsUser(voter) && canChangeThesisVote(thesis);
		const sameUser = user.person.isEqual(voter);
		const content = <>
			<VoteIndicator active={allowAction} value={this.props.value} />
			<VoteLabel
				style={sameUser ? { fontWeight: "bold" } : {}}
			>{voter.username}</VoteLabel>
		</>;
		return allowAction
			? <VoteContainerActive onClick={this.onClick}>{content}</VoteContainerActive>
			: <VoteContainerInactive>{content}</VoteContainerInactive>;
	}

	private onClick = () => {
		this.props.onChange(this.props.voter, nextValue(this.props.value));
	}
}

function nextValue(value: ThesisVote) {
	const valIdx = voteCycle.indexOf(value);
	return voteCycle[(valIdx + 1) % voteCycle.length];
}

const VoteContainerBase = styled.div`
	margin-bottom: 5px;
	user-select: none;
`;

const VoteContainerActive = styled(VoteContainerBase)`
	cursor: pointer;
`;

const VoteContainerInactive = styled(VoteContainerBase)`
	cursor: default;
`;

const VoteLabel = styled.span`
	margin-left: 5px;
	width: 60px;
	display: inline-block;
	text-align: left;
`;
