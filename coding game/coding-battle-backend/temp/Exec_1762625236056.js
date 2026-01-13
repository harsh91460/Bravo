// 1. Brute Force Approach
function twoSumBruteForce(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return null;
}

// 2. Hash Map Approach
function twoSumHashMap(nums, target) {
    const numMap = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (numMap.has(complement)) {
            return [numMap.get(complement), i];
        }
        numMap.set(nums[i], i);
    }
    return null;
}

// 3. Two-Pointer Approach
function twoSumTwoPointers(nums, target) {
    const numsWithIndices = nums.map((num, index) => [num, index]);
    numsWithIndices.sort((a, b) => a[0] - b[0]); // Sort by the numbers

    let left = 0, right = numsWithIndices.length - 1;

    while (left < right) {
        const currentSum = numsWithIndices[left][0] + numsWithIndices[right][0];
        if (currentSum === target) {
            return [numsWithIndices[left][1], numsWithIndices[right][1]];
        } else if (currentSum < target) {
            left++;
        } else {
            right--;
        }
    }
    return null;
}