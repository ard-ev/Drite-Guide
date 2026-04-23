from collections.abc import Iterable


def sync_translations(entity, translation_model, payloads: Iterable, value_fields: list[str]) -> None:
    existing = {translation.language_code: translation for translation in entity.translations}
    payloads = list(payloads)
    incoming_codes = {payload.language_code for payload in payloads}

    entity.translations[:] = [translation for translation in entity.translations if translation.language_code in incoming_codes]

    for payload in payloads:
        translation = existing.get(payload.language_code)
        if translation is None:
            values = {field: getattr(payload, field) for field in value_fields}
            entity.translations.append(
                translation_model(language_code=payload.language_code, **values)
            )
            continue
        for field in value_fields:
            value = getattr(payload, field)
            if value is not None:
                setattr(translation, field, value)
