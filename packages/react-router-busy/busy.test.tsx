import { expect, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import {
	type RouteObject,
	RouterProvider,
	createMemoryRouter,
} from "react-router-dom";
import { BusyForm, BusyLink } from "./src/busy";

test("Submitting BusyForm puts inputs into busy state", async () => {
	const routes: RouteObject[] = [
		{
			path: "/",
			element: (
				// Form requires accessible name to have form role https://github.com/testing-library/dom-testing-library/issues/474#issuecomment-597606894
				<BusyForm aria-label="form">
					<input id="input" type="text" />
					<input id="readonly-input" type="text" readOnly />
					<textarea id="textarea" />
					<textarea id="readonly-textarea" readOnly />
					<select id="select">
						<option value="option-a" />
						<option value="option-b" />
						<option value="disabled-option" disabled />
					</select>
					{/* Implicit type is submit */}
					<button id="submit-button">Submit</button>
					{/* TODO label, fieldset, legend, datalist, output, optgroup */}
				</BusyForm>
			),
			loader: () => null,
		},
	];

	const router = createMemoryRouter(routes, {
		initialEntries: ["/"],
	});

	render(<RouterProvider router={router} />);

	const form = await waitFor(() => screen.getByRole<HTMLFormElement>("form"));
	expect(form.input.getAttribute("readonly")).toBe(null);
	expect(form.input.getAttribute("aria-busy")).toBe(null);
	expect(form["readonly-input"].getAttribute("readonly")).toBe("");
	expect(form["readonly-input"].getAttribute("aria-busy")).toBe(null);
	expect(form.textarea.getAttribute("readonly")).toBe(null);
	expect(form.textarea.getAttribute("aria-busy")).toBe(null);
	expect(form["readonly-textarea"].getAttribute("readonly")).toBe("");
	expect(form["readonly-textarea"].getAttribute("aria-busy")).toBe(null);
	expect(form.select.getAttribute("aria-busy")).toBe(null);
	[...form.select.options].map((option: HTMLOptionElement) => {
		if (option.value === "disabled-option") {
			expect(option.getAttribute("disabled")).toBe("");
		} else {
			expect(option.getAttribute("disabled")).toBe(null);
		}
		expect(option.getAttribute("aria-busy")).toBe(null);
	});
	expect(form["submit-button"].getAttribute("aria-busy")).toBe(null);

	form["submit-button"].click();

	// Check if the form and its inputs are in a busy state
	await waitFor(() => {
		expect(form.input.getAttribute("readonly")).toBe("");
		expect(form.input.getAttribute("aria-busy")).toBe("true");
		expect(form["readonly-input"].getAttribute("readonly")).toBe("");
		expect(form["readonly-input"].getAttribute("aria-busy")).toBe(null);
		expect(form.textarea.getAttribute("readonly")).toBe("");
		expect(form.textarea.getAttribute("aria-busy")).toBe("true");
		expect(form["readonly-textarea"].getAttribute("readonly")).toBe("");
		expect(form["readonly-textarea"].getAttribute("aria-busy")).toBe(null);
		expect(form.select.getAttribute("aria-busy")).toBe("true");
		[...form.select.options].map((option: HTMLOptionElement) => {
			// option-a is selected
			if (option.selected) {
				expect(option.getAttribute("disabled")).toBe(null);
				expect(option.getAttribute("aria-busy")).toBe(null);
			} else if (option.value === "disabled-option") {
				expect(option.getAttribute("disabled")).toBe("");
				expect(option.getAttribute("aria-busy")).toBe(null);
			} else {
				expect(option.getAttribute("disabled")).toBe("");
				expect(option.getAttribute("aria-busy")).toBe("true");
			}
		});
		expect(form["submit-button"].getAttribute("aria-busy")).toBe("true");
	});
});

test("Clicking BusyLink puts link into busy state", async () => {
	const routes: RouteObject[] = [
		{
			path: "/",
			element: <BusyLink to="/test">Link</BusyLink>,
			loader: () => null,
		},
		{
			path: "/test",
			element: null,
			loader: () => null,
		},
	];

	const router = createMemoryRouter(routes, {
		initialEntries: ["/"],
	});

	render(<RouterProvider router={router} />);

	const link = await waitFor(() => screen.getByRole<HTMLAnchorElement>("link"));
	expect(link.getAttribute("aria-busy")).toBe(null);

	// Need to add base url since there is none during test
	link.href = `http://test.com${link.getAttribute("href")}`;
	link.click();

	await waitFor(() => {
		expect(link.getAttribute("aria-busy")).toBe("true");
	});
});
