import { forwardRef, useEffect, useRef, useState } from "react";
import {
	Form,
	type FormProps,
	Link,
	type LinkProps,
	useFetcher,
	useNavigation,
} from "react-router-dom";
import classes from "./busy.module.css";

// Enable/disable all inputs via readonly except select by disabling all other options and submit button via aria-busy
const toggleInputs = (form: HTMLFormElement, on = false) => {
	// TODO Check that this handles form elements outside form with form attribute
	const inputs = form.elements;
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		if (input instanceof HTMLButtonElement && input.type === "submit") {
			if (on) {
				input.setAttribute("aria-busy", "true");
			} else {
				input.removeAttribute("aria-busy");
			}
			continue;
		}
		// select doesn't have readonly attribute
		if (input instanceof HTMLSelectElement) {
			// Disable options that don't match current value https://stackoverflow.com/a/23428851
			const options = input.options;
			for (let j = 0; j < options.length; j++) {
				const option = options[j];
				// Could also just check !option.selected
				if (on && option.value !== input.value && !option.disabled) {
					option.setAttribute("disabled", "");
					// Also set aria-busy to say why it's disabled so we don't enable otherwise disabled options in else
					option.setAttribute("aria-busy", "true");
				} else if (!on && option.hasAttribute("aria-busy")) {
					option.removeAttribute("disabled");
					option.removeAttribute("aria-busy");
				}
			}
			// Also set aria-busy on select to style it busy
			if (on) {
				input.setAttribute("aria-busy", "true");
			} else {
				input.removeAttribute("aria-busy");
			}

			continue;
		}
		// Disabled causes input to not be submitted
		// aria-busy can't use pointer-events-none since then cursor styling doesn't apply so readonly is only way to disallow modifying input while submitting
		if (on && !input.hasAttribute("readonly")) {
			input.setAttribute("readonly", "");
			// Also set aria-busy to say why it's disabled so we don't enable otherwise readonly options in else
			input.setAttribute("aria-busy", "true");
		} else if (!on && input.hasAttribute("aria-busy")) {
			input.removeAttribute("readonly");
			input.removeAttribute("aria-busy");
		}
	}
};

// biome-ignore lint/suspicious/noExplicitAny: https://github.com/remix-run/remix/blob/main/packages/remix-react/components.tsx
function mergeRefs<T = any>(
	...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
	return (value) => {
		// biome-ignore lint/complexity/noForEach: <explanation>
		refs.forEach((ref) => {
			if (typeof ref === "function") {
				ref(value);
			} else if (ref != null) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		});
	};
}

/**
 * Pass in navigate=false and fetcherKey when using fetcher
 */
export const BusyForm = forwardRef<HTMLFormElement, FormProps>(
	// Extract props we are overwriting, not ones we just use for side effects
	({ onSubmit, className, ...props }, forwardedRef) => {
		const fetcher = useFetcher({ key: props.fetcherKey });
		const ref = useRef<HTMLFormElement>(null);
		const navigation = useNavigation();

		useEffect(() => {
			if (!ref.current) return;
			// Could be slightly more optimistic with (fetcher.state === 'loading' && fetcher.data is not error state) but requires an extra param for consumer to say what is error state
			if (!props.navigate && fetcher.state === "idle") {
				toggleInputs(ref.current);
			}
		}, [fetcher.state, props.navigate]);

		// Separate effect for navigation case just to avoid any concurrency issues
		useEffect(() => {
			if (!ref.current) return;
			// Now loading state stays until navigation, before it stopped shortly before so better now
			if (navigation.state === "idle") {
				// In dev could just toggle to opposite of current state but only because of double render
				// In prod with single render, need to specify state since this runs on mount and would set busy incorrectly
				toggleInputs(ref.current);
			}
		}, [navigation.state]);

		// Could have also done useEffect and toggle inputs on form ref
		// State is a little different there. onSubmit trigger before form sent, which is why we couldn't use disabled, but better to not use disabled anyway

		return (
			<Form
				{...props}
				// Benefit of toggling on here is it only switches on the busy state for the form you're interacting with
				// Doing it in an effect that listened to navigation state would have to also check form action is same current navigation action
				onSubmit={(event) => {
					// TODO If multiple submit buttons in form, all go into busy
					// This is different from before when we had BusyButton, but this may be desirable
					toggleInputs(event.currentTarget, true);
					onSubmit?.(event);
				}}
				ref={mergeRefs(forwardedRef, ref)}
				className={[classes.busyForm, className].join(" ")}
			/>
		);
	},
);

export const BusyLink = forwardRef<HTMLAnchorElement, LinkProps>(
	({ onClick, "aria-busy": ariaBusy, className, ...props }, forwardedRef) => {
		const navigation = useNavigation();
		// TODO This also handles if the related destination changes dynamically?
		const [submittingTo, setSubmittingTo] = useState<string>();

		return (
			<Link
				{...props}
				ref={forwardedRef}
				onClick={(event) => {
					// TODO Handle external link
					const link = event.currentTarget;
					if (link.tagName === "A") {
						setSubmittingTo(new URL(link.href).pathname);

						// Would then need ref to unset after done loading
						// event.currentTarget.setAttribute("aria-busy", "true");
					}

					onClick?.(event);
				}}
				aria-busy={
					// Don't need to reset submittingTo since it goes idle after and then for future nav, its location.pathname will still have to match this instance's submittingTo
					(["submitting", "loading"].includes(navigation.state) &&
						submittingTo === navigation.location?.pathname) ||
					ariaBusy
				}
				className={[classes.busyLink, className].join(" ")}
			/>
		);
	},
);
