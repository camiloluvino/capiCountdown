/**
 * ARCHIVED: Legacy Bamboo Countdown Visualization
 * 
 * This file contains the logic for the original bamboo stick countdown.
 * It was replaced by the Tree Countdown on Feb 11, 2026.
 * 
 * Usage: formerly called by updateAll() in script.js
 */

function renderTally(days, animateRemoval = false) {
    const container = document.getElementById('counter');

    // Simplified "Visual" Trick:
    // Just render the new state. The user sees the count drop.
    // To make it cooler, let's try to render the "falling" stick.

    if (!container) return;
    container.innerHTML = '';

    const bundles = Math.floor(days / 5);
    const remainder = days % 5;

    // Render full bundles
    for (let i = 0; i < bundles; i++) {
        createBundle(5, true, container);
    }

    // Render remainder
    if (remainder > 0) {
        createBundle(remainder, false, container);
    }

    // If we want to show a falling stick (the one that just vanished)
    if (animateRemoval) {
        const fallingStick = document.createElement('div');
        fallingStick.className = 'stick falling';
        fallingStick.style.height = '60px'; // Approximate bundle height
        fallingStick.style.width = '8px';
        fallingStick.style.marginLeft = '10px';
        container.appendChild(fallingStick);
    }

    // document.getElementById('daysText').innerText = `Faltan ${days} días`;
}

function createBundle(count, isCompleted, parent) {
    const bundle = document.createElement('div');
    bundle.className = 'bundle';
    if (isCompleted) bundle.classList.add('completed');

    const verticalCount = isCompleted ? 4 : count;

    for (let i = 0; i < 4; i++) {
        const stick = document.createElement('div');
        stick.className = 'stick';
        if (i >= verticalCount) {
            stick.style.opacity = '0';
        }
        bundle.appendChild(stick);
    }

    if (isCompleted) {
        const diagonal = document.createElement('div');
        diagonal.className = 'stick diagonal';
        bundle.appendChild(diagonal);

        const yuzu = document.createElement('div');
        yuzu.className = 'yuzu';
        bundle.appendChild(yuzu);
    }

    parent.appendChild(bundle);
}
