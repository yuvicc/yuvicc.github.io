package day05

// Dedup removes consecutive duplicate values in place.
func Dedup(s []int) []int {
	if len(s) == 0 {
		return s
	}
	w := 1
	for r := 1; r < len(s); r++ {
		if s[r] != s[w-1] {
			s[w] = s[r]
			w++
		}
	}
	return s[:w]
}
