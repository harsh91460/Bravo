def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

# Input
nums = list(map(int, input().split()))
target = int(input())

# Output
result = twoSum(nums, target)
print(result)