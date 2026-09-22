package day05

import (
	"slices"
	"testing"
)

func TestDedup(t *testing.T) {
	tests := []struct { name string; in, want []int }{
		{"empty", []int{}, []int{}}, {"unique", []int{1,2,3}, []int{1,2,3}},
		{"same", []int{7,7,7}, []int{7}}, {"mixed", []int{1,1,2,3,3,4}, []int{1,2,3,4}},
	}
	for _, tt := range tests { t.Run(tt.name, func(t *testing.T) {
		in := slices.Clone(tt.in); got := Dedup(in)
		if !slices.Equal(got, tt.want) { t.Fatalf("got %v, want %v", got, tt.want) }
		if len(got) > 0 && &got[0] != &in[0] { t.Fatal("Dedup allocated a new backing array") }
	}) }
}
