# react-router-busy

Improve your app's UX with just an import. A simple and performant package for accessible form input, button, and link **loading states**.

For use with [react-router](https://github.com/remix-run/react-router) 6+ or [remix](https://github.com/remix-run/remix) 2+.

> [!IMPORTANT]  
> [Vite currently throws an error when trying to import the CSS module](https://github.com/vitejs/vite/issues/9487) this library uses to change the cursor, so please add the following to your vite.config for now, which will be fixed in the future:
> ```
> ssr: {
>   noExternal: ['react-router-busy'],
> },
> ```

## The problem

![Editing input after submitting](https://github.com/user-attachments/assets/cc6f5a95-c2c8-4877-82ce-7dee317e063e)

## The solution

If you'd like to see an example, check it out live on https://gitsell.dev. Also see react-router-busy/src/busy.module.css for an example of what to target to style the various busy states.

### BusyForm

Render `BusyForm` instead of `Form` or `fetcher.Form`:
* All the form's inputs will become `readonly` during submission to prevent someone from changing input data during submission and causing themselves confusion. The `cursor` will be `wait` if hovering over an input.
* The form's submit button will become `aria-busy="true"` during submission to prevent double-clicking and causing extraneous requests. The `cursor` will be `wait` if hovering over the button, and `pointer-events` will be `none` to actually prevent clicking.

This library doesn't make inputs `disabled` because it causes the field to not be sent in the form data and it's not accessibility friendly to dynamically toggle.

#### With navigation

```tsx
import { BusyForm } from 'react-router-busy';

...

return (
  <BusyForm
    action="/action"
    method="POST"
  >
    {...inputs}
    <button>Submit</button>
  </BusyForm>
)
```

#### With fetcher

```tsx
import { BusyForm } from 'react-router-busy';

...

const fetcher = useFetcher({ key: "key" });

return (
  <BusyForm
    action="/action"
    method="POST"
    navigate={false}
    fetcherKey="key"
  >
    {...inputs}
    <button>Submit</button>
  </BusyForm>
)
```

### BusyLink

This library assumes all your buttons are in forms. But links are another story, so `BusyLink` is a replacement for `Link` to add this functionality for URLs to your app.

```tsx
import { BusyLink } from 'react-router-busy';

...

return (
  <BusyLink
    to=""
  >
    Link
  </BusyLink>
)
```

## To do

- Fix CSS module import error "TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css" for node_modules/react-router-busy/build/busy.module.css"
- Fix a keyboard user still being able re-press the button
- NavLink, Better not to have all that extra code for the `as` prop
- Also export as Form and Link in case consumers prefer not replacing name
- Make an option where you can edit the inputs after submission which cancels the current submission
