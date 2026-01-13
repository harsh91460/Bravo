# 1. Brute Force Approach
def two_sum_brute_force(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return None

# 2. Hash Map Approach
def two_sum_hash_map(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return None

# 3. Two-Pointer Approach
def two_sum_two_pointers(nums, target):
    nums_with_indices = sorted((num, index) for index, num in enumerate(nums))
    left, right = 0, len(nums_with_indices) - 1

    while left < right:
        current_sum = nums_with_indices[left][0] + nums_with_indices[right][0]
        if current_sum == target:
            return [nums_with_indices[left][1], nums_with_indices[right][1]]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return None