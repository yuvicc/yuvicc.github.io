import type { Day } from './course';
export type Question = { id: string; prompt: string; code?: string; options: Array<{ text: string; correct?: boolean; why: string }> };

const sliceQuestions: Question[] = [
  { id:'d05-q01', prompt:'After s := make([]int, 2, 5), what are len(s) and cap(s)?', options:[
    {text:'2 and 5',correct:true,why:'make([]T, len, cap) sets both explicitly.'},{text:'5 and 5',why:'The second argument is length.'},{text:'0 and 5',why:'The two elements exist and contain zero values.'},{text:'2 and 2',why:'Capacity was explicitly set to 5.'}]},
  { id:'d05-q02', prompt:'What does this print?', code:'a := []int{1, 2, 3, 4}\nb := a[:2]\nb = append(b, 99)\nfmt.Println(a)', options:[
    {text:'[1 2 99 4]',correct:true,why:'b has spare capacity in a’s backing array.'},{text:'[1 2 3 4]',why:'append allocates only when capacity is exceeded.'},{text:'[1 2 99]',why:'a still has length 4.'},{text:'[1 2 3 4 99]',why:'Appending to b does not change a’s length.'}]},
  { id:'d05-q03', prompt:'What is the zero value of a slice?', options:[{text:'nil',correct:true,why:'A nil slice has length and capacity zero and is safe to range over.'},{text:'[]T{}',why:'An empty literal is non-nil.'},{text:'A one-element slice',why:'No storage is allocated.'},{text:'It is undefined',why:'Go defines a useful zero value.'}]},
  { id:'d05-q04', prompt:'Why does addOne(s []int) fail to grow the caller’s slice?', code:'func addOne(s []int) { s = append(s, 1) }', options:[{text:'The slice header is passed by value',correct:true,why:'Return the updated slice so the caller receives the new header.'},{text:'append cannot use empty slices',why:'append works with empty and nil slices.'},{text:'The backing array is immutable',why:'Slice backing arrays are mutable.'},{text:'It needs make',why:'How the slice was created does not change argument passing.'}]},
  { id:'d05-q05', prompt:'Which operation makes an independent shallow copy of s?', options:[{text:'clone := append([]int(nil), s...)',correct:true,why:'append copies the elements into new storage.'},{text:'clone := s',why:'This copies only the slice header.'},{text:'clone := s[:]',why:'This still shares the backing array.'},{text:'clone := &s',why:'This points to the same header.'}]},
  { id:'d05-q06', prompt:'What does a full slice expression a[low:high:max] control?', options:[{text:'The result’s capacity',correct:true,why:'Its capacity is max-low, which can force a later append to allocate.'},{text:'Only its element type',why:'The element type does not change.'},{text:'The backing array length',why:'The backing array is unchanged.'},{text:'Garbage collection',why:'It primarily sets slice bounds and capacity.'}]},
  { id:'d05-q07', prompt:'When are two arrays directly comparable?', options:[{text:'When their element type is comparable',correct:true,why:'Arrays are comparable if their elements are comparable.'},{text:'Never',why:'Arrays can be compared; slices cannot.'},{text:'Only when empty',why:'Length does not decide comparability.'},{text:'Only through reflect.DeepEqual',why:'The == operator works for comparable arrays.'}]},
  { id:'d05-q08', prompt:'What does copy(dst, src) return?', options:[{text:'The number of elements copied',correct:true,why:'It copies min(len(dst), len(src)) elements.'},{text:'A new slice',why:'copy writes into dst.'},{text:'An error',why:'Bounds are handled by the built-in.'},{text:'The destination capacity',why:'The return value is a count.'}]},
  { id:'d05-q09', prompt:'Why can reusing one inner slice break a 2D slice?', options:[{text:'Rows can share the same backing array',correct:true,why:'Mutating one row can then change another.'},{text:'Go forbids nested slices',why:'Slices of slices are common.'},{text:'Inner slices are immutable',why:'They are mutable.'},{text:'append always panics',why:'append is valid for inner slices.'}]},
  { id:'d05-q10', prompt:'Which is true about nil and empty slices?', options:[{text:'Both have length zero, but only the nil slice equals nil',correct:true,why:'They often behave alike, but nil-ness and some encodings differ.'},{text:'They are identical in every context',why:'JSON encoding and nil checks distinguish them.'},{text:'Ranging over nil panics',why:'It performs zero iterations.'},{text:'append to nil panics',why:'append allocates as needed.'}]},
];

export function questionsFor(day: Day): Question[] {
  if (day.id === '05') return sliceQuestions;
  const topic = day.topics[0] ?? 'Go';
  const stem = (n: number, prompt: string, right: string, wrong: string[]): Question => ({ id:`d${day.id}-q${String(n).padStart(2,'0')}`, prompt, options:[{text:right,correct:true,why:`That follows the core ${topic} rule used in today’s lesson.`},...wrong.map((text)=>({text,why:'This conflicts with the behavior described in the lesson.'}))] });
  return [
    stem(1, `What is the main goal of today’s ${day.title} lesson?`, day.summary, ['Memorize syntax without running it','Avoid tests until the project is complete','Replace the standard library by default']),
    stem(2, `Which practice best supports clear ${topic} code?`, 'Make behavior explicit and verify it with a small example', ['Rely on hidden global state','Ignore returned errors','Optimize before measuring']),
    stem(3, 'What should you do before claiming a program works?', 'Run it and test the important behavior', ['Read it once','Count its lines','Add more dependencies']),
    stem(4, 'What is the most useful response to a failing test?', 'Read the failure, reduce the case, then fix the cause', ['Delete the test','Retry without changing anything','Hide the error output']),
    stem(5, 'Which design usually makes Go code easier to maintain?', 'Small functions with explicit inputs and outputs', ['One function for the whole program','Mutable package globals','Discarded errors']),
    stem(6, `How should you approach the ${day.title} coding task?`, 'Start with the smallest passing case, then add edges', ['Begin with every stretch goal','Copy code without explaining it','Skip gofmt and tests']),
    stem(7, 'Why does the course include a reflection note?', 'Explaining what clicked exposes gaps and strengthens recall', ['It unlocks a hidden route','Go requires written notes','It replaces practice']),
    stem(8, 'When should you use the Go documentation?', 'Whenever behavior or an API contract is uncertain', ['Only after production fails','Never during exercises','Only for third-party packages']),
  ];
}
