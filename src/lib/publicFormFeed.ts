import { FormType } from "@/types";


let publicForms: FormType[] = [];

export const addPublicForm = (form: FormType): FormType | undefined => {
    if (getPublicFormById(form.id)) {
        return undefined
    }
    if (publicForms.length > 100) {
        publicForms.shift()
    }

    publicForms = [...publicForms, form]

    return form
}

export const getAllPublicForms = (): FormType[] => {
    return publicForms
}

export const getPublicFormById = (id:string): FormType | undefined => {
    const formIndex = publicForms.findIndex(f => f.id == id)

    if (formIndex >= 0) {
        return publicForms[formIndex]
    }

    return undefined
}
