def longest_unique_substring(s: str) -> int:
   # Dictionary to store the last index of each character
   char_index_map = {}
   max_length = 0
   start = 0 # Start index of the current window
   for end in range(len(s)):
       # If the character is already in the dictionary and within the current window
       if s[end] in char_index_map and char_index_map[s[end]] >= start:
           start = char_index_map[s[end]] + 1 # Move the start index to avoid repetition
       # Update the last seen index of the character
       char_index_map[s[end]] = end
       # Calculate the maximum length of the substring
       max_length = max(max_length, end - start + 1)
   return max_length
# Example usage
input_string = "abcabcbb"
print("The length of the longest substring without repeating characters is:", longest_unique_substring(input_string))