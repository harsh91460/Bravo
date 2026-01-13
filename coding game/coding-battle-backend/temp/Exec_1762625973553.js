def twoSum(nums, target):
    # HashMap Approach - O(n)
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Input
nums = list(map(int, input().split()))
target = int(input())

# Output
result = twoSum(nums, target)
print(result)