# generate spec files for tsx files w/o them
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for f in $(cd ${SCRIPT_DIR}/../ && git ls-files | grep -E 'ts(x){0,1}$' | grep -v spec | grep -v api | grep -v redux | grep -v appShell | grep -v typings)
do 
        (test -e ${f/.ts*/.spec.ts} || test -e ${f/.ts*/.spec.tsx}) || \
            cat ${SCRIPT_DIR}/spec.tsx.template | \
                sed "s:## basename of file here ##:$(basename ${f/.ts*/}):g" > ${f/.ts*/.spec.tsx};
done
