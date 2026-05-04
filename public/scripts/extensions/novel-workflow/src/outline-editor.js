export function createOutlineState({ mainPlotline = null, subplots = [] } = {}) {
    return { mainPlotline, subplots };
}

export function validateMainPlotlineRequired(state) {
    return Boolean(state?.mainPlotline);
}

export function canAddSubplot(_state) {
    return true;
}
