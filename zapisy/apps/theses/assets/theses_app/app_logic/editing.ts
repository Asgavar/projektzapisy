import { observable, action, flow, computed } from "mobx";
import { clone } from "lodash";

import { Thesis } from "../thesis";
import { ThesisEmptyTitle } from "../errors";
import { saveModifiedThesis, saveNewThesis } from "../backend_callers";
import { ThesisWorkMode, ApplicationState } from "../app_types";
import { AppMode } from "./app_mode";
import { List } from "./theses_list";
import { Users } from "./users";
import { ThesisTypeFilter } from "../protocol_types";
import { adjustDomForUngraded } from "../utils";

/** The currently selected thesis */
type CompositeThesis = {
	/** Its original, unchanged version */
	original: Thesis;
	/** And the version the user is modifying */
	modified: Thesis;
};

class C {
	@observable thesis: CompositeThesis | null = null;

	@action
	public initialize() {
		if (List.shouldSelectUngradedThesis()) {
			// automatically select a thesis to grade if any
			this.selectThesis(List.theses[0]);
		}
	}

	/**
	 * Set the specified thesis as selected
	 * @param thesis The thesis to select; must be in the local theses list
	 */
	@action
	public selectThesis(thesis: Thesis) {
		console.assert(List.indexOfThesis(thesis) !== -1, "Tried to select a nonexistent thesis");
		AppMode.workMode = ThesisWorkMode.Editing;
		this.thesis = compositeThesisForThesis(thesis);
	}

	/** The position of the currently selected thesis in the list */
	@computed
	public get selectedIdx() {
		const { thesis } = this;
		return thesis ? List.indexOfThesis(thesis.original) : -1;
	}

	/** Determine whether we have a thesis being modified and if so,
	 * whether it's different from the original one
	 */
	@computed
	public get hasUnsavedChanges() {
		const { thesis } = this;
		return (
			thesis !== null &&
			!thesis.original.areValuesEqual(thesis.modified)
		);
	}

	/**
	 * Update the modified thesis instance (it's an immutable object, a new instance
	 * must be set)
	 * @param thesis The new modified instance
	 */
	@action
	public updateModifiedThesis(thesis: Thesis) {
		if (!this.thesis) {
			console.error("Modified nonexistent thesis");
			return;
		}
		this.thesis.modified = thesis;
	}

	/**
	 * Set the specified thesis as active and switch to adding mode
	 * @param thesis The thesis we'll be adding
	 */
	@action
	public setupForNewThesis(thesis: Thesis) {
		AppMode.workMode = ThesisWorkMode.Adding;
		this.thesis = compositeThesisForThesis(thesis);
	}

	/**
	 * Discard all changes in the modified instance, resetting it to original
	 */
	@action
	public resetModifiedThesis() {
		console.assert(this.thesis != null);
		this.thesis = compositeThesisForThesis(this.thesis!.original);
	}

	private preSaveAsserts() {
		const { thesis } = this;
		if (thesis === null) {
			console.assert(false, "Tried to save thesis but none selected, this shouldn't happen");
			return false;
		}
		const { workMode } = AppMode;
		if (workMode === ThesisWorkMode.Viewing) {
			console.assert(false, "Tried to perform a save action when only viewing");
			return false;
		}
		if (!this.hasUnsavedChanges) {
			console.assert(false, "save() called but no unsaved changes");
			return false;
		}
		if (AppMode.isPerformingBackendOp()) {
			console.assert(false, "Called save() but we're already doing something backend-related");
			return false;
		}
		return true;
	}

	private performPreSaveChecks() {
		const { modified } = this.thesis!;
		const trimmedTitle = modified.title.trim();
		if (!trimmedTitle) {
			throw new ThesisEmptyTitle();
		}
	}

	private static handlerForWorkMode = {
		[ThesisWorkMode.Adding]: addNewThesis,
		[ThesisWorkMode.Editing]: modifyExistingThesis,
	};

	/**
	 * Save the currently selected thesis. It is an error to call this
	 * if there are no unsaved changes.
	 */
	public save = flow(function*(this: C) {
		try {
			if (!this.preSaveAsserts()) {
				return;
			}
			this.performPreSaveChecks();

			const thesis = this.thesis!;
			const { workMode } = AppMode;

			AppMode.applicationState = ApplicationState.Saving;
			type NonViewModes = (ThesisWorkMode.Adding | ThesisWorkMode.Editing);
			const handler = C.handlerForWorkMode[workMode as NonViewModes];

			const id = yield handler(thesis);

			const numUngraded = yield List.getNumUngraded();
			List.adjustFiltersPostSave(numUngraded);

			// Reload without losing the current position
			yield List.reloadTheses();

			const toSelect = thesisToSelectAfterAction(thesis.modified, id);
			// no matter what the work mode was, if we have a thesis we end up in the edit view
			if (toSelect) {
				this.selectThesis(toSelect);
			} else {
				AppMode.workMode = ThesisWorkMode.Viewing;
			}
			adjustDomForUngraded(numUngraded);
		} finally {
			AppMode.applicationState = ApplicationState.Normal;
		}
	});
}

async function modifyExistingThesis(thesis: CompositeThesis) {
	await saveModifiedThesis(thesis.original, thesis.modified);
	return thesis!.original.id;
}

function addNewThesis(thesis: CompositeThesis) {
	return saveNewThesis(thesis.modified);
}

function compositeThesisForThesis(t: Thesis | null) {
	return t ? { original: t, modified: clone(t) } : null;
}

function thesisToSelectAfterAction(modifiedThesis: Thesis, savedId: number) {
	const shouldSelectOtherUngraded = (
		Users.isUserMemberOfBoard() &&
		List.params.type === ThesisTypeFilter.Ungraded &&
		// don't switch away from this thesis if it's not graded still
		!modifiedThesis.isUngraded()
	);

	return (
		shouldSelectOtherUngraded && List.findUngraded() ||
		// We'll want to find the thesis we just saved
		// Note that it _could_ technically be absent from the new list
		// but the odds are absurdly low (it would have to be deleted by someone
		// else or the admin in the time between those two requests above)
		List.getThesisById(savedId) ||
		null
	);
}

export const ThesisEditing = new C();