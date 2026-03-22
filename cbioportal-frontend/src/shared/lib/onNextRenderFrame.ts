// Source: https://stackoverflow.com/a/34999925/3158208

// This function is used when you need to execute code at the next render frame, so after the current
// call stack has been cleared, and everything has been rendered and painted.

// One use case is if you want to set scrollTop of an element, you need to wait until its been rendered
// and painted before it is ready to take that information. But componentDidUpdate is executed possibly before
// all of that is done. So you need to wait until the call stack is cleared (setTimeout 0) and painting is done
// (requestAnimationFrame)

export default function onNextRenderFrame(callback: (...args: any[]) => void) {
    setTimeout(() => {
        window.requestAnimationFrame(callback);
    }, 0);
}
