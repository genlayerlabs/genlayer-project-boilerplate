def test_web_verifier_submit(direct_vm, direct_deploy):
    direct_vm.mock_web(
        r".*example\.com.*",
        {
            "status": 200,
            "body": "This domain is for use in illustrative examples in documents.",
        },
    )

    direct_vm.mock_llm(
        r".*Verify this claim using the webpage content.*",
        '{"result": "verified", "evidence": "The webpage is an example domain."}',
    )

    contract = direct_deploy("contracts/web_verifier.py")

    contract.submit_verification(
        "The website is an example domain",
        "https://example.com",
    )

    result = contract.get_verification("The website is an example domain")

    assert result["claim"] == "The website is an example domain"
    assert result["url"] == "https://example.com"
    assert result["result"] == "verified"
