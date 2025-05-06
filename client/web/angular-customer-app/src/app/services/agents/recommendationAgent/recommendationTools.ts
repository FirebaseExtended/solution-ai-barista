interface Recommendation {
    name: string;
    modifiers: string[];
}

const defaultRecommendation = {
    name: 'Mocha',
    modifiers: ['double shots', 'chocolate sauce']
};

/**
 * Load the recommendation from the recommendation service.
 * 
 * This demonstrates how a tool call can access external services, such as a HTTP endpoint.
 */
// async function loadRecommendation(): Promise<Recommendation | undefined> {
//     console.info('Loading recommendation from service');
//     try {
//         const response = await fetch(`${process.env["LOCAL_RECOMMENDATION_SERVICE"]}/recommendation`);
//         if (response.ok) {
//             const result = await response.json();
//             return { name: result.name, modifiers: result.modifiers };
//         } else {
//             console.warn('Could not access local recommendation service.', { response: response });
//         }
//     } catch (error) {
//         console.error('Error loading recommendation from service.', { error: error });
//     }
//     return;
// }

export const getBaristaRecommendation = () => {
    console.info('[get_barista_recommendation]');

    let recommendation: Recommendation | undefined;

    // if (process.env["LOCAL_RECOMMENDATION_SERVICE"]) {
    //     recommendation = await loadRecommendation();
    // }
    // // Fall back to the default recommendation if it could not be loaded.
    // if (!recommendation) {
    //     recommendation = defaultRecommendation;
    //     console.warn('[get_barista_recommendation] Falling back to local recommendation');
    // }
    recommendation = defaultRecommendation;
    console.info('[get_barista_recommendation] Returning barista recommendation.', { recommendation: recommendation });
    return recommendation;
}